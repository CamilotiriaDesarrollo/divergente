# programar_tarea.ps1 — Registra la tarea programada del scrape (lun/jue 06:00).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts\programar_tarea.ps1            # registrar
#   powershell -ExecutionPolicy Bypass -File scripts\programar_tarea.ps1 -Quitar    # desregistrar
#
# La tarea corre scripts/scrape_programado.ps1 como el usuario actual, sin
# privilegios elevados. Si el PC estaba apagado a las 06:00, corre al encender
# (StartWhenAvailable).

param([switch]$Quitar)

$nombre = "ScraperEmpleos-Scrape"
$proyecto = Split-Path -Parent $PSScriptRoot
$wrapper = Join-Path $proyecto "scripts\scrape_programado.ps1"

if ($Quitar) {
    Unregister-ScheduledTask -TaskName $nombre -Confirm:$false
    Write-Output "Tarea '$nombre' eliminada."
    exit 0
}

$accion = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$wrapper`""

$triggers = @(
    (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 06:00),
    (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Thursday -At 06:00)
)

$config = New-ScheduledTaskSettingsSet -StartWhenAvailable `
    -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $nombre -Action $accion -Trigger $triggers `
    -Settings $config -Description "Scraper Empleos: scrape lun/jue 06:00 + refresco de landing" -Force | Out-Null

Write-Output "Tarea '$nombre' registrada (lunes y jueves 06:00, StartWhenAvailable)."
Get-ScheduledTask -TaskName $nombre | Select-Object TaskName, State
