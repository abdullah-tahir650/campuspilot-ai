$ErrorActionPreference = 'Stop'

# This installer expects this add-on folder directly inside the existing
# campuspilot-ai project root.
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $projectRoot 'backend'
$frontendDir = Join-Path $projectRoot 'frontend'
$mainPath = Join-Path $backendDir 'main.py'

if (-not (Test-Path $mainPath)) {
    throw "Could not find backend\main.py at '$mainPath'. Extract the add-on folder inside your campuspilot-ai project root."
}
if (-not (Test-Path $frontendDir)) {
    throw "Could not find the existing frontend folder at '$frontendDir'."
}

Copy-Item -Force (Join-Path $PSScriptRoot 'backend\alexa_demo.py') (Join-Path $backendDir 'alexa_demo.py')
Copy-Item -Force (Join-Path $PSScriptRoot 'frontend\alexa-demo.html') (Join-Path $frontendDir 'alexa-demo.html')

$content = [System.IO.File]::ReadAllText($mainPath)
$original = $content

$importLine = 'from backend.alexa_demo import router as alexa_demo_router'
if ($content -notmatch [regex]::Escape($importLine)) {
    if ($content -match '(?m)^from backend\.mcp_client import call_mcp_tool\s*$') {
        $content = [regex]::Replace(
            $content,
            '(?m)^(from backend\.mcp_client import call_mcp_tool\s*)$',
            ('$1' + "`r`n" + $importLine),
            1
        )
    } elseif ($content -match '(?m)^from backend\.ai_assistant import .+$') {
        $content = [regex]::Replace(
            $content,
            '(?m)^(from backend\.ai_assistant import .+)$',
            ('$1' + "`r`n" + $importLine),
            1
        )
    } else {
        throw 'Could not find a safe place to add the router import in backend\main.py. Add the import manually from README.txt.'
    }
}

if ($content -notmatch '(?m)^app\.include_router\(alexa_demo_router\)\s*$') {
    $fastApiPattern = '(?ms)^app = FastAPI\(\r?\n.*?^\)'
    if ($content -notmatch $fastApiPattern) {
        throw 'Could not locate the app = FastAPI(...) block. Files were copied; add app.include_router(alexa_demo_router) manually as described in README.txt.'
    }
    $content = [regex]::Replace(
        $content,
        $fastApiPattern,
        ('$0' + "`r`n`r`napp.include_router(alexa_demo_router)"),
        1
    )
}

if ($content -ne $original) {
    $backupPath = "$mainPath.before_alexa_demo.bak"
    if (-not (Test-Path $backupPath)) {
        Copy-Item $mainPath $backupPath
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($mainPath, $content, $utf8NoBom)
}

Write-Host ''
Write-Host 'CampusPilot Voice demo installed.' -ForegroundColor Green
Write-Host 'Files added: backend\alexa_demo.py and frontend\alexa-demo.html'
Write-Host 'A backup of main.py was kept as backend\main.py.before_alexa_demo.bak (if changes were needed).'
Write-Host ''
Write-Host 'Next: keep the MCP server running, then start FastAPI with:' -ForegroundColor Cyan
Write-Host '.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload'
Write-Host 'Open: http://127.0.0.1:8000/alexa-demo'
