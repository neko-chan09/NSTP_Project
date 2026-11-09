<!doctype html>
<html><head><meta charset="utf-8"><title>Certificate</title>
<style>
    @page { size: A4 landscape; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 297mm; height: 209.9mm; position: relative; background: {{ $design['background'] }}; }
    .background { position: absolute; left: 0; top: 0; width: 297mm; height: 210mm; }
    .border { position: absolute; left: 6.9mm; top: 6.9mm; width: 283.2mm; height: 196.2mm; border: .8mm solid #142440; }
    .inner { position: absolute; left: 10mm; top: 10mm; width: 277mm; height: 190mm; border: .3mm solid {{ $design['accent'] }}; }
    .element { position: absolute; overflow: hidden; }
    .text { white-space: pre-wrap; overflow-wrap: break-word; line-height: 1.25; }
    .artwork { width: 100%; height: 100%; }
</style></head><body>
@if(!empty($design['backgroundImage']))
    <img class="background" src="{{ $design['backgroundImage'] }}" alt="">
@endif
@if($design['border'] !== 'none')
    <div class="border" @if($design['border'] === 'double') style="border: 1.3mm double {{ $design['accent'] }}" @endif></div>
    <div class="inner"></div>
@endif
@foreach($elements as $element)
    @php
        $x = $element['x'] * 297 / 1120;
        $y = $element['y'] * 210 / 792;
        $width = $element['width'] * 297 / 1120;
        $height = $element['height'] * 210 / 792;
        $fontSize = $element['fontSize'] * 297 / 1120;
    @endphp
    <div class="element" style="left: {{ $x }}mm; top: {{ $y }}mm; width: {{ $width }}mm; height: {{ $height }}mm;">
        @if($element['kind'] === 'text')
            <div class="text" style="font-family: '{{ $element['font'] }}'; font-size: {{ $fontSize }}mm; color: {{ $element['color'] }}; font-weight: {{ $element['bold'] ? 'bold' : 'normal' }}; font-style: {{ $element['italic'] ? 'italic' : 'normal' }}; text-align: {{ $element['align'] }};">{{ $element['text'] }}</div>
        @elseif($element['kind'] === 'line')
            <div style="width: 100%; height: 100%; background: {{ $element['color'] }};"></div>
        @elseif($element['kind'] === 'image')
            @php
                $size = getimagesizefromstring(base64_decode(explode(',', $element['src'], 2)[1]));
                $ratio = min($width / $size[0], $height / $size[1]);
                $imageWidth = $size[0] * $ratio;
                $imageHeight = $size[1] * $ratio;
            @endphp
            <img src="{{ $element['src'] }}" alt="" style="position: absolute; width: {{ $imageWidth }}mm; height: {{ $imageHeight }}mm; left: {{ ($width - $imageWidth) / 2 }}mm; top: {{ ($height - $imageHeight) / 2 }}mm;">
        @elseif($element['kind'] === 'qr')
            @php($qrSize = min($width, $height))
            <img src="{{ $qr }}" alt="Verify certificate" style="position: absolute; width: {{ $qrSize }}mm; height: {{ $qrSize }}mm; left: {{ ($width - $qrSize) / 2 }}mm; top: {{ ($height - $qrSize) / 2 }}mm;">
        @endif
    </div>
@endforeach
</body></html>
