// Sample satellite image generator for ASTRA AI prototype
// Generates high-fidelity GOES-16 IR (Channel 13) satellite image data URLs

function createSatelliteCanvas(type, timeOffset = 0, isIntermediate = false) {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background deep space / ocean base
  const bgGrad = ctx.createRadialGradient(200, 200, 50, 200, 200, 260);
  bgGrad.addColorStop(0, '#101622');
  bgGrad.addColorStop(1, '#06090e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 400, 400);

  // Subtle coordinate grid lines (GOES projection)
  ctx.strokeStyle = 'rgba(70, 110, 140, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 40; x < 400; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 400); ctx.stroke();
  }
  for (let y = 40; y < 400; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(400, y); ctx.stroke();
  }

  // Draw scene patterns based on type
  if (type === 'cyclone') {
    // Swirling spiral storm
    const cx = 200 + timeOffset * 18;
    const cy = 200 - timeOffset * 10;
    const angleBase = timeOffset * 0.45;

    for (let r = 160; r > 20; r -= 14) {
      const g = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
      const alpha = (1 - r / 200) * 0.85;
      g.addColorStop(0, `rgba(235, 245, 255, ${alpha})`);
      g.addColorStop(0.5, `rgba(130, 185, 225, ${alpha * 0.7})`);
      g.addColorStop(1, 'rgba(20, 40, 70, 0)');
      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.arc(cx, cy, r, angleBase + (r / 20) * 0.35, angleBase + (r / 20) * 0.35 + Math.PI * 1.4);
      ctx.fill();
    }

    // Eye of the storm
    ctx.fillStyle = '#0a0f16';
    ctx.beginPath();
    ctx.arc(cx, cy, 14 + (isIntermediate ? 1 : 0), 0, Math.PI * 2);
    ctx.fill();

    // Cold convective cloud tops (high brightness temperature gradients)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(cx - 24, cy + 18, 22, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'convective') {
    // Explosive convective anvil
    const cx = 190 + timeOffset * 22;
    const cy = 210 - timeOffset * 15;
    const size = 65 + timeOffset * 35; // Expands rapidly

    const anvilGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, size);
    anvilGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    anvilGrad.addColorStop(0.35, 'rgba(220, 240, 255, 0.85)');
    anvilGrad.addColorStop(0.7, 'rgba(110, 160, 210, 0.5)');
    anvilGrad.addColorStop(1, 'rgba(10, 20, 40, 0)');

    ctx.fillStyle = anvilGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 1.2, size * 0.9, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Secondary flanking cells
    ctx.fillStyle = 'rgba(180, 215, 245, 0.6)';
    ctx.beginPath();
    ctx.arc(cx + size * 0.7, cy + 20, 26, 0, Math.PI * 2);
    ctx.arc(cx - size * 0.6, cy - 25, 20, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'frontal') {
    // Elongated laminar frontal boundary
    const xShift = timeOffset * 30;
    ctx.save();
    ctx.translate(xShift, 0);

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(${210 + i * 10}, ${230 + i * 5}, 255, ${0.4 + i * 0.15})`;
      ctx.beginPath();
      ctx.moveTo(-50, 80 + i * 40);
      ctx.bezierCurveTo(120, 140 + i * 30, 240, 220 + i * 20, 450, 310 + i * 30);
      ctx.lineTo(450, 360 + i * 30);
      ctx.bezierCurveTo(240, 270 + i * 20, 120, 190 + i * 30, -50, 130 + i * 40);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

  } else {
    // Gravity wave ripples
    const xBase = 200 + timeOffset * 25;
    for (let wave = 0; wave < 10; wave++) {
      const alpha = Math.sin((wave / 10) * Math.PI) * 0.7;
      ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(xBase, 80 + wave * 25, 110 + wave * 4, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Calibration corner badge overlay
  ctx.fillStyle = 'rgba(10, 16, 24, 0.75)';
  ctx.fillRect(8, 8, 170, 24);
  ctx.strokeStyle = 'rgba(0, 87, 255, 0.4)';
  ctx.strokeRect(8, 8, 170, 24);

  ctx.fillStyle = '#0057FF';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('GOES-16 ABI Ch.13', 14, 23);

  ctx.fillStyle = '#E2E0DB';
  ctx.font = '8px monospace';
  ctx.fillText('10.3 μm Clean IR', 95, 23);

  return canvas.toDataURL('image/png');
}

export const SAMPLE_SCENES = [
  {
    id: 'cyclone',
    title: 'Tropical Cyclone Vortex',
    description: 'Spiral cloud bands and central eye advection across western Atlantic.',
    timeA: '14:00 UTC',
    timeB: '14:15 UTC',
    getImgA: () => createSatelliteCanvas('cyclone', 0),
    getImgB: () => createSatelliteCanvas('cyclone', 1),
    getIntermediate: (t = 0.5) => createSatelliteCanvas('cyclone', t, true)
  },
  {
    id: 'convective',
    title: 'Severe Convective Cell',
    description: 'Rapid explosive anvil growth and deep tropospheric cooling over Plains.',
    timeA: '18:20 UTC',
    timeB: '18:35 UTC',
    getImgA: () => createSatelliteCanvas('convective', 0),
    getImgB: () => createSatelliteCanvas('convective', 1),
    getIntermediate: (t = 0.5) => createSatelliteCanvas('convective', t, true)
  },
  {
    id: 'frontal',
    title: 'Mid-Latitude Cold Front',
    description: 'Synoptic shear band with steady eastward advection and laminar flow.',
    timeA: '06:10 UTC',
    timeB: '06:25 UTC',
    getImgA: () => createSatelliteCanvas('frontal', 0),
    getImgB: () => createSatelliteCanvas('frontal', 1),
    getIntermediate: (t = 0.5) => createSatelliteCanvas('frontal', t, true)
  },
  {
    id: 'waves',
    title: 'Atmospheric Gravity Waves',
    description: 'Mesoscale transverse cloud ripple advection in high-shear jet level.',
    timeA: '12:00 UTC',
    timeB: '12:15 UTC',
    getImgA: () => createSatelliteCanvas('waves', 0),
    getImgB: () => createSatelliteCanvas('waves', 1),
    getIntermediate: (t = 0.5) => createSatelliteCanvas('waves', t, true)
  }
];

// Helper to blend/morph two images onto a canvas for user-uploaded custom images
export function blendImagesOnCanvas(imgAUrl, imgBUrl, t = 0.5) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve('');

    const imgA = new Image();
    const imgB = new Image();
    let loaded = 0;

    const onComplete = () => {
      loaded++;
      if (loaded === 2) {
        // Draw image A
        ctx.globalAlpha = 1.0;
        ctx.drawImage(imgA, 0, 0, 400, 400);

        // Blend image B with opacity t
        ctx.globalAlpha = Math.min(1, Math.max(0, t));
        ctx.drawImage(imgB, 0, 0, 400, 400);

        // Reset globalAlpha
        ctx.globalAlpha = 1.0;

        // Add ASTRA synthesis watermark
        ctx.fillStyle = 'rgba(0, 87, 255, 0.85)';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`ASTRA AI RECONSTRUCTED · t* = ${(t * 100).toFixed(0)}%`, 14, 385);

        resolve(canvas.toDataURL('image/png'));
      }
    };

    imgA.onload = onComplete;
    imgB.onload = onComplete;
    imgA.onerror = () => resolve(imgBUrl || '');
    imgB.onerror = () => resolve(imgAUrl || '');

    imgA.src = imgAUrl;
    imgB.src = imgBUrl;
  });
}
