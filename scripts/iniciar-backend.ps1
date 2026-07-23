$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "back-and-Eycount\LogicaEycount"

if (-not $env:DB_URL) {
    $env:DB_URL = "jdbc:mysql://localhost:3306/eyecount"
}

if (-not $env:DB_USER) {
    $env:DB_USER = "root"
}

if (-not $env:DB_PASSWORD) {
    throw "Defina a variavel DB_PASSWORD antes de iniciar o backend."
}

if (-not $env:JWT_SECRET) {
    throw "Defina a variavel JWT_SECRET antes de iniciar o backend."
}

if ($env:JWT_SECRET.Length -lt 32) {
    throw "JWT_SECRET deve possuir pelo menos 32 caracteres."
}

Set-Location $Backend
mvn spring-boot:run