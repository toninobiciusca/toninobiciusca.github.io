/**
 * Full-Screen 3D Neural Network Perspective Canvas Simulator
 * Coded for Tonino Biciusca's Professional Scroll Portfolio
 * Represents an interactive rotating 3D self-attention graph & neural activation field.
 */

class NeuralBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.isRunning = true;
        this.animationFrameId = null;

        // Configuration
        this.nodeCount = 65; // Balanced for performance and density
        this.nodes = [];
        this.maxConnectionsDistance = 220; // 3D connection threshold
        
        // Perspective parameters
        this.focalLength = 500;
        this.depthOfField = 600; // Depth box size: [-300, 300]
        
        // 3D rotation angles
        this.angleX = 0;
        this.angleY = 0;
        this.speedX = 0.0005; // Ambient X rotation speed
        this.speedY = 0.0008; // Ambient Y rotation speed

        // Interactive mouse parallax state
        this.mouseX = -1000;
        this.mouseY = -1000;
        this.tiltX = 0;
        this.tiltY = 0;
        this.mouseAttentionRadius = 180; // Projected screen-space interaction radius

        // Data packets flowing along 3D connections
        this.packets = [];
        this.maxPackets = 45;
        this.packetSpawnRate = 0.05; // Rate of packet firing

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize neural nodes in a 3D volume
        const w = this.canvas.width;
        const h = this.canvas.height;
        const d = this.depthOfField;

        for (let i = 0; i < this.nodeCount; i++) {
            this.nodes.push({
                x: (Math.random() - 0.5) * w * 0.9,
                y: (Math.random() - 0.5) * h * 0.9,
                z: (Math.random() - 0.5) * d,
                vx: (Math.random() - 0.5) * 0.25, // Slow ambient drift inside 3D volume
                vy: (Math.random() - 0.5) * 0.25,
                vz: (Math.random() - 0.5) * 0.25,
                r: 1.5 + Math.random() * 2, // Base radius of neuron node
                pulse: Math.random() * Math.PI,
                pulseSpeed: 0.01 + Math.random() * 0.02,
                color: { r: 213, g: 224, b: 255 } // Ice-blue nodes
            });
        }

        // Track mouse movements relative to center
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.mouseX = -1000;
            this.mouseY = -1000;
        });

        // Pause/resume when page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        this.animate();
    }

    setScrollProgress(progress) {
        this.scrollProgress = progress;
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    updateNodes() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const d = this.depthOfField;

        // Boundaries inside 3D space
        const boundX = w * 0.5;
        const boundY = h * 0.5;
        const boundZ = d * 0.5;

        this.nodes.forEach(node => {
            // Apply coordinates drift
            node.x += node.vx;
            node.y += node.vy;
            node.z += node.vz;

            // Bounce check boundaries in 3D
            if (node.x < -boundX || node.x > boundX) node.vx *= -1;
            if (node.y < -boundY || node.y > boundY) node.vy *= -1;
            if (node.z < -boundZ || node.z > boundZ) node.vz *= -1;

            // Ambient pulse
            node.pulse += node.pulseSpeed;
        });
    }

    updatePackets() {
        // Update active packets progress
        for (let i = this.packets.length - 1; i >= 0; i--) {
            const p = this.packets[i];
            p.progress += p.speed;

            if (p.progress >= 1) {
                this.packets.splice(i, 1);
            }
        }
    }

    spawnPacket(startNode, endNode) {
        if (this.packets.length >= this.maxPackets) return;

        this.packets.push({
            startNode,
            endNode,
            x: startNode.x,
            y: startNode.y,
            z: startNode.z,
            progress: 0,
            speed: 0.01 + Math.random() * 0.015, // Travel speed along path
            color: 'rgba(213, 224, 255, 0.6)'
        });
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const centerX = w * 0.5;
        const centerY = h * 0.5;

        // Clear canvas with trail blur clearing overlay
        ctx.fillStyle = 'rgba(2, 10, 25, 0.24)';
        ctx.fillRect(0, 0, w, h);

        const progress = this.scrollProgress || 0;

        // Fly-through scroll depth calculation (Translate 2400px forward on scroll)
        const scrollZ = progress * 2400;
        const d = this.depthOfField;
        const boundZ = d * 0.5;

        // Constellation panning wave coordinates based on scroll progress
        const panX = Math.sin(progress * Math.PI * 2.5) * 220;
        const panY = Math.cos(progress * Math.PI * 2.5) * 160;

        // Scroll-locked rotation shift
        const scrollAngleY = progress * Math.PI * 1.5; // Rotate 270 degrees
        const scrollAngleX = Math.sin(progress * Math.PI) * 0.3; // Subtle pitch warp

        // Update 3D rotation angles
        this.angleX += this.speedX;
        this.angleY += this.speedY;

        // Mouse Parallax tilt interpolation (spring dynamics)
        let targetTiltX = 0;
        let targetTiltY = 0;
        if (this.mouseX >= 0 && this.mouseX <= w && this.mouseY >= 0 && this.mouseY <= h) {
            targetTiltX = ((this.mouseY - centerY) / centerY) * 0.3; // Max 0.3 radians vertical tilt
            targetTiltY = ((this.mouseX - centerX) / centerX) * 0.3; // Max 0.3 radians horizontal tilt
        }
        this.tiltX += (targetTiltX - this.tiltX) * 0.05;
        this.tiltY += (targetTiltY - this.tiltY) * 0.05;

        const totalAngleX = this.angleX + this.tiltX + scrollAngleX;
        const totalAngleY = this.angleY + this.tiltY + scrollAngleY;

        const cosX = Math.cos(totalAngleX);
        const sinX = Math.sin(totalAngleX);
        const cosY = Math.cos(totalAngleY);
        const sinY = Math.sin(totalAngleY);

        // 1. Transform, wrap Z, and project all nodes
        this.nodes.forEach(node => {
            // Apply infinite scroll fly-through depth wrapping
            let nz = node.z + scrollZ;
            nz = ((nz + boundZ) % d + d) % d - boundZ;
            node.nz = nz; // Save wrapped Z for connection checks

            // Translate camera coordinate offsets (pan)
            const px = node.x + panX;
            const py = node.y + panY;
            const pz = nz;

            // Y rotation
            let x1 = px * cosY - pz * sinY;
            let z1 = px * sinY + pz * cosY;

            // X rotation
            let y1 = py * cosX - z1 * sinX;
            let z2 = py * sinX + z1 * cosX;

            // Save rotated coordinates
            node.rx = x1;
            node.ry = y1;
            node.rz = z2;

            // Perspective scale
            node.scale = this.focalLength / (this.focalLength + z2);
            node.projX = centerX + x1 * node.scale;
            node.projY = centerY + y1 * node.scale;
        });

        // 2. Transform and project all active packets (interpolate visual rotated coordinates directly)
        this.packets.forEach(p => {
            const nodeA = p.startNode;
            const nodeB = p.endNode;

            p.rx = nodeA.rx + (nodeB.rx - nodeA.rx) * p.progress;
            p.ry = nodeA.ry + (nodeB.ry - nodeA.ry) * p.progress;
            p.rz = nodeA.rz + (nodeB.rz - nodeA.rz) * p.progress;
            p.scale = this.focalLength / (this.focalLength + p.rz);
            p.projX = centerX + p.rx * p.scale;
            p.projY = centerY + p.ry * p.scale;
        });

        // 3. Draw connection lines (Synapses) based on 3D distance
        const nodes = this.nodes;
        const n = nodes.length;

        for (let i = 0; i < n; i++) {
            const nodeA = nodes[i];
            for (let j = i + 1; j < n; j++) {
                const nodeB = nodes[j];

                // Compute 3D distance between nodes using wrapped nz values
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const dz = nodeA.nz - nodeB.nz;
                const distSq = dx * dx + dy * dy + dz * dz;
                const limitSq = this.maxConnectionsDistance * this.maxConnectionsDistance;

                if (distSq < limitSq) {
                    const dist = Math.sqrt(distSq);
                    const weight = 1 - (dist / this.maxConnectionsDistance);
                    
                    // Average depth of the connection line
                    const avgZ = (nodeA.rz + nodeB.rz) * 0.5;
                    const perspectiveAlpha = Math.max(0.01, Math.min(1.0, this.focalLength / (this.focalLength + avgZ)));

                    ctx.strokeStyle = `rgba(213, 224, 255, ${weight * perspectiveAlpha * 0.15})`;
                    ctx.lineWidth = (0.3 + weight * 0.8) * perspectiveAlpha;
                    ctx.beginPath();
                    ctx.moveTo(nodeA.projX, nodeA.projY);
                    ctx.lineTo(nodeB.projX, nodeB.projY);
                    ctx.stroke();

                    // Ambient packet spawning
                    if (Math.random() < 0.0002) {
                        this.spawnPacket(nodeA, nodeB);
                    }
                }
            }
        }

        // 4. Mouse Interactivity (Attentional attraction links) in 2D projected space
        const hasMouse = (this.mouseX >= 0 && this.mouseX <= w && this.mouseY >= 0 && this.mouseY <= h);
        if (hasMouse) {
            ctx.beginPath();
            ctx.arc(this.mouseX, this.mouseY, 4, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(213, 224, 255, 0.8)';
            ctx.fill();

            // Connect mouse to projected nodes
            nodes.forEach(node => {
                const dx = node.projX - this.mouseX;
                const dy = node.projY - this.mouseY;
                const distSq = dx * dx + dy * dy;
                const limitSq = this.mouseAttentionRadius * this.mouseAttentionRadius;

                if (distSq < limitSq) {
                    const dist = Math.sqrt(distSq);
                    const weight = 1 - (dist / this.mouseAttentionRadius);
                    const perspectiveAlpha = Math.max(0.1, node.scale);

                    ctx.strokeStyle = `rgba(213, 224, 255, ${weight * perspectiveAlpha * 0.18})`;
                    ctx.lineWidth = (0.5 + weight * 1.0) * perspectiveAlpha;
                    ctx.beginPath();
                    ctx.moveTo(this.mouseX, this.mouseY);
                    ctx.lineTo(node.projX, node.projY);
                    ctx.stroke();

                    // Fire active user packet
                    if (Math.random() < this.packetSpawnRate) {
                        // Find a random connected node to send a packet to
                        const targetNode = nodes[Math.floor(Math.random() * n)];
                        this.spawnPacket(node, targetNode);
                    }
                }
            });
        }

        // 5. Draw Nodes & Packets depth-sorted (Back-to-Front render layering)
        const renderList = [];

        // Add nodes to render list
        nodes.forEach((node, idx) => {
            renderList.push({
                type: 'node',
                z: node.rz,
                node: node
            });
        });

        // Add packets to render list
        this.packets.forEach(p => {
            renderList.push({
                type: 'packet',
                z: p.rz,
                packet: p
            });
        });

        // Sort render tasks by depth (descending z coordinates, which is furthest away first)
        renderList.sort((a, b) => b.z - a.z);

        // Draw render tasks
        renderList.forEach(item => {
            if (item.type === 'node') {
                const node = item.node;
                const pulseSize = Math.sin(node.pulse) * 0.8;
                const currentRadius = Math.max(0.5, (node.r + pulseSize) * node.scale);
                const alpha = Math.max(0.05, Math.min(1.0, node.scale));

                // Outer aura halo
                ctx.fillStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, ${alpha * 0.05})`;
                ctx.beginPath();
                ctx.arc(node.projX, node.projY, currentRadius * 2.5, 0, 2 * Math.PI);
                ctx.fill();

                // Core node
                ctx.fillStyle = `rgba(${node.color.r}, ${node.color.g}, ${node.color.b}, ${alpha * 0.45})`;
                ctx.beginPath();
                ctx.arc(node.projX, node.projY, currentRadius, 0, 2 * Math.PI);
                ctx.fill();
            } else {
                const p = item.packet;
                const size = Math.max(0.8, 2 * p.scale);
                const alpha = Math.max(0.1, Math.min(1.0, p.scale));

                ctx.fillStyle = `rgba(213, 224, 255, ${alpha * 0.85})`;
                ctx.beginPath();
                ctx.arc(p.projX, p.projY, size, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }

    animate() {
        if (!this.isRunning) return;

        this.updateNodes();
        this.updatePackets();
        this.render();

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    pause() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }
}

// Instantiate background
document.addEventListener('DOMContentLoaded', () => {
    window.neuralBackgroundInstance = new NeuralBackground('fluid-bg-canvas');
});
