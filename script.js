    // Simple 2D platformer using <canvas>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');

    // Game settings
    const GRAVITY = 0.9;
    const FRICTION = 0.85;
    const PLAYER_SPEED = 4.2;
    const JUMP_FORCE = 15.5;

    // Player state
    const player = {
      x: 60,
      y: 300,
      w: 34,
      h: 44,
      vx: 0,
      vy: 0,
      onGround: false,
      color: '#ff6b6b'
    };

    // Platforms (x, y, width, height)
    let platforms = [
      {x:0, y:480, w:900, h:40}, // ground
      {x:120, y:380, w:140, h:16},
      {x:330, y:320, w:120, h:16},
      {x:520, y:270, w:180, h:16},
      {x:760, y:200, w:120, h:16},
      {x:380, y:460, w:90, h:12}
    ];

    // Simple collectible stars
    let stars = [
      {x:150, y:340, r:8, collected:false},
      {x:360, y:280, r:8, collected:false},
      {x:620, y:230, r:8, collected:false},
      {x:800, y:160, r:8, collected:false}
    ];

    let score = 0;

    // Input
    const keys = { left:false, right:false, up:false };
    window.addEventListener('keydown', e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') keys.up = true;
    });
    window.addEventListener('keyup', e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') keys.up = false;
    });

    // Basic collision detection (AABB)
    function aabb(ax,ay,aw,ah,bx,by,bw,bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function update() {
      // Horizontal movement
      if (keys.left) player.vx = Math.max(player.vx - 0.8, -PLAYER_SPEED);
      if (keys.right) player.vx = Math.min(player.vx + 0.8, PLAYER_SPEED);

      // Apply friction
      if (!keys.left && !keys.right) player.vx *= FRICTION;

      // Gravity
      player.vy += GRAVITY;

      // Jump - only if on ground
      if (keys.up && player.onGround) {
        player.vy = -JUMP_FORCE;
        player.onGround = false;
      }

      // Apply velocities
      player.x += player.vx;
      player.y += player.vy;

      // Simple world bounds
      if (player.x < 0) { player.x = 0; player.vx = 0; }
      if (player.x + player.w > canvas.width) { player.x = canvas.width - player.w; player.vx = 0; }
      if (player.y > canvas.height + 200) {
        // fell off screen, reset
        resetPlayer();
      }

      // Platform collisions (naive: move back and test vertical overlap)
      player.onGround = false;
      for (let p of platforms) {
        if (aabb(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
          // Determine collision side by checking previous position
          // We'll push the player up to the top of platform if coming from above
          if (player.vy > 0 && (player.y + player.h - player.vy) <= p.y + 4) {
            player.y = p.y - player.h;
            player.vy = 0;
            player.onGround = true;
          } else if (player.vy < 0 && (player.y - player.vy) >= p.y + p.h - 4) {
            // hit head
            player.y = p.y + p.h;
            player.vy = 0.5; // small downward push
          } else {
            // Horizontal collision: push player out (simple approach)
            if (player.x < p.x) player.x = p.x - player.w - 0.1;
            else player.x = p.x + p.w + 0.1;
            player.vx = 0;
          }
        }
      }

      // Collect stars
      for (let s of stars) {
        if (!s.collected) {
          const sx = s.x - s.r, sy = s.y - s.r, sw = s.r*2, sh = s.r*2;
          if (aabb(player.x, player.y, player.w, player.h, sx, sy, sw, sh)) {
            s.collected = true;
            score += 10;
            scoreEl.textContent = score;
          }
        }
      }

      // Simple camera: translate the world so player is slightly left of center
      // We won't implement fancy scrolling to keep the example short. Instead, keep static canvas.
    }

    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);

      // Background sky gradient
      const g = ctx.createLinearGradient(0,0,0,canvas.height);
      g.addColorStop(0,'#9BE7FF');
      g.addColorStop(1,'#D6F7FF');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,canvas.width,canvas.height);

      // Draw platforms
      for (let p of platforms) {
        ctx.fillStyle = '#2d6a4f';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // platform edge
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.strokeRect(p.x, p.y, p.w, p.h);
      }

      // Draw stars (collectibles)
      for (let s of stars) {
        if (s.collected) continue;
        drawStar(s.x, s.y, s.r);
      }

      // Draw player
      ctx.fillStyle = player.color;
      roundRect(ctx, player.x, player.y, player.w, player.h, 6, true, false);

      // simple eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(player.x + 8, player.y + 12, 6, 6);
      ctx.fillRect(player.x + 20, player.y + 12, 6, 6);

      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath(); ctx.ellipse(player.x + player.w/2, player.y + player.h + 8, player.w/2.4, 6, 0, 0, Math.PI*2); ctx.fill();
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }

    // Helpers
    function resetPlayer(){
      player.x = 60; player.y = 300; player.vx = 0; player.vy = 0; player.onGround = false; score = 0; scoreEl.textContent = score;
      for (let s of stars) s.collected = false;
    }

    function roundRect(ctx, x, y, w, h, r, fill, stroke) {
      if (typeof r === 'undefined') r = 5;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }

    function drawStar(cx, cy, r){
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      for (let i=0;i<5;i++){
        ctx.lineTo(Math.cos((18+72*i)/180*Math.PI)*r, -Math.sin((18+72*i)/180*Math.PI)*r);
        ctx.lineTo(Math.cos((54+72*i)/180*Math.PI)*(r*0.5), -Math.sin((54+72*i)/180*Math.PI)*(r*0.5));
      }
      ctx.closePath();
      ctx.fillStyle = '#ffd166';
      ctx.fill();
      ctx.restore();
    }

    // Start
    resetPlayer();
    loop();

    // Simple touch controls for mobile: left/right/jump zones
    (function setupTouch(){
      let touchStartX = null;
      window.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        touchStartX = t.clientX;
        // simple: left half = left, right half = right. Tap top area to jump.
        if (t.clientY < window.innerHeight * 0.35) { keys.up = true; }
        else if (t.clientX < window.innerWidth/2) { keys.left = true; }
        else { keys.right = true; }
      });
      window.addEventListener('touchend', (e) => {
        keys.left = keys.right = keys.up = false;
      });
    })();

    // Resize handling (keep canvas fixed size for simplicity)
    // If you'd like responsive canvas, you can scale drawing by devicePixelRatio and CSS size.
