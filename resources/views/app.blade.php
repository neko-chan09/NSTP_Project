<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'NSTP Management System') }}</title>

    {{-- Fonts --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|inter:400,500,600,700" rel="stylesheet" />

    {{-- Font Awesome --}}
    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer" />

    {{-- ============================================================ --}}
    {{-- PWA --}}
    {{-- ============================================================ --}}
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#0A1628" />

    {{-- Favicon + Apple touch icon --}}
    <link rel="icon" type="image/png" href="/images/nstpLogo.png" />
    <link rel="apple-touch-icon" href="/images/nstpLogo.png" />

    {{-- This MUST come before @vite for React to work --}}
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>

<body>
    <div id="root"></div>
</body>

</html>