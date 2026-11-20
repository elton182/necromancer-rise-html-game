[CmdletBinding(DefaultParameterSetName = 'Generate')]
param(
    [Parameter(Mandatory, ParameterSetName = 'Generate')][string]$Image,
    [Parameter(Mandatory)][ValidatePattern('^[a-z][a-z0-9_]{1,63}$')][string]$Name,
    [Parameter(ParameterSetName = 'Generate')][switch]$Rig,
    [Parameter(ParameterSetName = 'Generate')][ValidateCount(0, 1)][ValidateSet('idle', 'walk', 'run', 'hurt', 'fall')][string[]]$Animations = @(),
    [Parameter(ParameterSetName = 'Generate')][switch]$PlanOnly,
    [Parameter(Mandatory, ParameterSetName = 'Resume')][ValidatePattern('^[a-zA-Z0-9-]+$')][string]$ResumeTask
)

# Execute de qualquer pasta. Nunca le chaves ou altera o perfil do Tripo.
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$exportRoot = Join-Path $projectRoot 'blender/exports'
$recordRoot = Join-Path $projectRoot "blender/logs/tripo/$Name"
$guardFile = Join-Path $recordRoot 'submission.json'
$env:TRIPO_CLIENT_APP = 'codex'
$env:TRIPO_DISTRIBUTION_CHANNEL = 'codex_plugin'
$cli = Get-Command tripo -ErrorAction Stop

function Invoke-TripoJson([string[]]$Arguments) {
    $lines = @(& $cli @Arguments)
    $code = $LASTEXITCODE
    $parsed = $null
    # Progresso vai para stderr; stdout termina com o resultado JSON.
    for ($i = $lines.Count - 1; $i -ge 0; $i--) {
        try { $parsed = ([string]$lines[$i]) | ConvertFrom-Json; break } catch {}
    }
    return @{ Code = $code; Data = $parsed; Raw = ($lines -join "`n") }
}

$version = (& $cli --version | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $version -notmatch '^(\d+)\.(\d+)\.(\d+)' -or [version]$Matches[0] -lt [version]'0.7.0') {
    throw 'Requer tripo-cli >= 0.7.0. Instale/atualize o CLI oficial antes de continuar.'
}

if ($PSCmdlet.ParameterSetName -eq 'Generate') {
    $imagePath = if ([IO.Path]::IsPathRooted($Image)) { $Image } else { Join-Path $projectRoot $Image }
    $imagePath = (Resolve-Path -LiteralPath $imagePath).Path
    if (-not (Test-Path -LiteralPath $imagePath -PathType Leaf) -or [IO.Path]::GetExtension($imagePath) -notmatch '^\.(png|jpg|jpeg|webp|bmp|tiff?)$') {
        throw 'Informe uma imagem local PNG, JPEG, WebP, BMP ou TIFF.'
    }
    if ($Animations.Count -and -not $Rig) { throw 'Use -Rig junto com -Animations.' }
    # CLI 0.11 pode escolher P2 (mais caro); fixe o modelo cujo custo foi previsto.
    $makeArgs = @('make', $imagePath, '--model', 'tripo-v3.1', '-p', 'texture=true', '-p', 'pbr=true', '-p', 'texture_quality=standard', '--name', $Name, '-o', $exportRoot, '--json', '--no-open')
    if ($Rig) {
        $steps = @('rig-check', 'rig:model=v2.5-20260210')
        foreach ($clip in ($Animations | Select-Object -Unique)) { $steps += "retarget:preset:$clip" }
        $makeArgs += @('--then', ($steps -join ','))
    }
    $plan = Invoke-TripoJson ($makeArgs + '--dry-run')
    if ($plan.Code -ne 0 -or -not $plan.Data.valid) { throw "Plano invalido: $($plan.Raw)" }
    if ($plan.Data.model -ne 'v3.1-20260211') { throw "Modelo inesperado: $($plan.Data.model). Revise a configuracao antes de gastar creditos." }
    $estimate = 30
    Write-Host "Entrada: $imagePath"
    Write-Host 'Modelo: tripo-v3.1 / v3.1-20260211; GLB texturizado com PBR.'
    $index = 0
    foreach ($step in $plan.Data.steps) {
        $index++
        $cost = switch ($step.name) {
            'image-to-model' { 30 }
            'rig-check' { 0 }
            'rig' { 25; $estimate += 25 }
            'retarget' { 10; $estimate += 10 }
            default { throw "Etapa nao prevista: $($step.name). Revise o plano." }
        }
        Write-Host "$index. $($step.endpoint) | ~$cost creditos | $($step.payload | ConvertTo-Json -Compress -Depth 20)"
    }
    foreach ($warning in $plan.Data.warnings) { Write-Warning $warning }
    Write-Host "Total estimado: $estimate creditos. Falhas definitivas sao reembolsadas; timeout pode continuar cobravel."
    Write-Host "Saidas: $exportRoot/tripo-out/<nome>-<id>/ (modelo, previa e task.json)."
    if ($PlanOnly) { return }
    if (Test-Path -LiteralPath $guardFile) {
        throw "Ja existe uma submissao para '$Name'. Confira $guardFile e tripo task list --json. Use -ResumeTask ID para retomar sem gerar novamente, ou outro nome para uma nova versao."
    }
    & $cli doctor
    if ($LASTEXITCODE -ne 0) { throw 'Diagnostico falhou. Nenhuma geracao foi submetida. Corrija a conexao/autenticacao no terminal.' }
    if ((Read-Host "Gerar por aproximadamente $estimate creditos? Digite SIM") -cne 'SIM') { Write-Host 'Cancelado sem submissao.'; return }
    New-Item -ItemType Directory -Path $recordRoot -Force | Out-Null
    # Guarda gravada ANTES da chamada paga: uma queda de rede nao permite repetir silenciosamente.
    @{ name = $Name; status = 'submitting'; created_at = [DateTime]::UtcNow.ToString('o'); image = $imagePath; estimated_credits = $estimate; plan = $plan.Data } |
        ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $guardFile -Encoding utf8
    $result = Invoke-TripoJson ($makeArgs + '--yes')
} else {
    # Retoma apenas uma tarefa existente. Nao refaz geracao, rig ou animacoes pendentes.
    New-Item -ItemType Directory -Path $recordRoot -Force | Out-Null
    $resumeOutput = Join-Path $exportRoot "tripo-out/$Name-resumed-$ResumeTask"
    $result = Invoke-TripoJson @('task', 'watch', $ResumeTask, '--download', '-o', $resumeOutput, '--json', '--no-open')
}

$stamp = [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss-fff')
$resultFile = Join-Path $recordRoot "result-$stamp.json"
$result.Raw | Set-Content -LiteralPath $resultFile -Encoding utf8
if ($result.Code -ne 0) {
    Write-Host $result.Raw
    throw "Tripo encerrou com codigo $($result.Code). Registro: $resultFile. Nao ha repeticao automatica. Confira tripo balance e tripo task list --json antes de outra geracao; retome a tarefa existente com -ResumeTask ID."
}
Write-Host "Resultado salvo: $resultFile"
Write-Host "Modelo: $($result.Data.model_file)"
Write-Host "Previa: $($result.Data.preview)"
if ($null -ne $result.Data.credits_consumed) { Write-Host "Creditos cobrados (total): $($result.Data.credits_consumed)" }
if ($result.Data.credits_breakdown) {
    foreach ($task in $result.Data.credits_breakdown) { Write-Host "  $($task.type) | $($task.task_id) | $($task.credits_consumed) creditos" }
} else {
    Write-Host "Tarefa: $($result.Data.task_id). Confira a cobranca por tarefa com: tripo task get $($result.Data.task_id) --json"
}
Write-Host 'Inspecione a previa e os dedos no Blender antes de integrar. Este script nao modifica models.json nem o jogo.'
