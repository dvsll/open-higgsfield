# Explicit, repeatable setup. No installation is triggered by generation.
$ErrorActionPreference = 'Stop'
$target = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../.runtime/prompt-rewriter'))
New-Item -ItemType Directory -Force $target | Out-Null
$archive = Join-Path $target 'runtime.zip'
$runtimeHash = '37b3efcf962847ca869745fd4ccf7f5e7e8dacfeff9fa3523b4ca8cdc66d632b'
if (!(Test-Path -LiteralPath $archive) -or (Get-FileHash -LiteralPath $archive).Hash -ne $runtimeHash) {
 Write-Host 'Downloading llama.cpp CPU runtime (MIT, about 20 MB)...'
 Invoke-WebRequest 'https://github.com/ggml-org/llama.cpp/releases/download/b11669/llama-b11669-bin-win-cpu-x64.zip' -OutFile $archive
}
if ((Get-FileHash -LiteralPath $archive).Hash -ne $runtimeHash) { throw 'Runtime checksum mismatch; not installing.' }
Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $target 'bin') -Force
$model = Join-Path $target 'model.gguf'
$modelHash = '6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e'
if (!(Test-Path -LiteralPath $model) -or (Get-FileHash -LiteralPath $model).Hash -ne $modelHash) {
 Write-Host 'Downloading Qwen2.5 1.5B Q4_K_M (Apache-2.0, about 1.12 GB)...'
 $partial = Join-Path $target 'model.gguf.part'
 curl.exe --fail --location --retry 3 --output $partial 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/91cad51170dc346986eccefdc2dd33a9da36ead9/qwen2.5-1.5b-instruct-q4_k_m.gguf'
 if ($LASTEXITCODE -ne 0) { throw 'Model download failed. Rerun setup to retry.' }
 if ((Get-FileHash -LiteralPath $partial).Hash -ne $modelHash) { throw 'Model checksum mismatch; not installing.' }
 Move-Item -LiteralPath $partial -Destination $model -Force
}
Write-Host 'Local prompt helper ready. It runs on CPU and starts only when rewriting.'
