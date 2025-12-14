param(
    [string]$PythonPath = "python"
)

$pythonCommand = Get-Command $PythonPath -ErrorAction SilentlyContinue
if (-not $pythonCommand) {
    Write-Error "Python executable not found. Provide a valid path with -PythonPath."
    exit 1
}

$venvDirectory = Join-Path (Get-Location) ".venv"
if (-not (Test-Path $venvDirectory)) {
    Write-Host "Creating virtual environment at $venvDirectory"
    & $pythonCommand.Source -m venv ".venv"
} else {
    Write-Host "Virtual environment already exists at $venvDirectory"
}

$activateScript = Join-Path $venvDirectory "Scripts\Activate.ps1"
if (-not (Test-Path $activateScript)) {
    Write-Error "Activation script not found at $activateScript"
    exit 1
}

Write-Host "Activating virtual environment..."
. $activateScript
