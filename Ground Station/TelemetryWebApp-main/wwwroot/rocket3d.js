// Set the rocket's rotation from pitch, yaw, roll (degrees)
function setRocket3DRotation(pitch, yaw, roll) {
    if (!rocket3dModel) return;
    // Roll: Z (blue, up/down), Pitch: Y (green, right), Yaw: X (red, forward)
    // Apply in order: roll (Z), pitch (Y), yaw (X)
    rocket3dModel.rotation.order = 'ZXY';
    rocket3dModel.rotation.y = THREE.MathUtils.degToRad(roll || 0);  // Roll (Z, blue)
    rocket3dModel.rotation.z = THREE.MathUtils.degToRad(yaw || 0);   // Yaw (X, red)
    rocket3dModel.rotation.x = THREE.MathUtils.degToRad(pitch || 0); // Pitch (Y, green)
}
// 3D Rocket visualization using three.js
// Assumes three.js is loaded via CDN in index.html


let rocket3dScene, rocket3dCamera, rocket3dRenderer, rocket3dModel;


function initRocket3D() {
    const container = document.getElementById('rocket3dContainer');
    rocket3dScene = new THREE.Scene();
    rocket3dCamera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    rocket3dCamera.position.set(0, 0, 4.2); // Move camera closer

    rocket3dRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rocket3dRenderer.setClearColor(0x111111, 1);
    rocket3dRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(rocket3dRenderer.domElement);


        // Create a group for the whole rocket
        const rocketGroup = new THREE.Group();

        // Cylinder body
        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.2, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        rocketGroup.add(body);

        // Cone nose
        const noseGeometry = new THREE.ConeGeometry(0.22, 0.5, 32);
        const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.y = 1.35;
        rocketGroup.add(nose);

        // Fins
        const finGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.18);
        const finMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        for (let i = 0; i < 3; i++) {
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.y = -1.1;
            fin.position.x = Math.cos((i * 2 * Math.PI) / 3) * 0.18;
            fin.position.z = Math.sin((i * 2 * Math.PI) / 3) * 0.18;
            fin.rotation.y = (i * 2 * Math.PI) / 3;
            rocketGroup.add(fin);
        }

        // Custom axes at the bottom of the rocket
        const axesLength = 1.2;
        const axesOpacity = 0.6;
    const axesRadius = 0.06; // Even thicker lines
    // Z axis (blue) - points forward (out of screen)
    const xMat = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: axesOpacity, depthTest: false });
    const xGeom = new THREE.CylinderGeometry(axesRadius, axesRadius, axesLength, 16);
    const xAxis = new THREE.Mesh(xGeom, xMat);
    xAxis.position.set(0, -1.1, axesLength/2);
    xAxis.rotation.x = -Math.PI/2;
    rocketGroup.add(xAxis);
    // Y axis (green) - points right
    const yMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: axesOpacity, depthTest: false });
    const yGeom = new THREE.CylinderGeometry(axesRadius, axesRadius, axesLength, 16);
    const yAxis = new THREE.Mesh(yGeom, yMat);
    yAxis.position.set(axesLength/2, -1.1, 0);
    yAxis.rotation.z = Math.PI/2;
    rocketGroup.add(yAxis);
    // X axis (red) - points up
    const zMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: axesOpacity, depthTest: false });
    const zGeom = new THREE.CylinderGeometry(axesRadius, axesRadius, axesLength, 16);
    const zAxis = new THREE.Mesh(zGeom, zMat);
    zAxis.position.set(0, -1.1 + axesLength/2, 0);
    rocketGroup.add(zAxis);

    rocketGroup.scale.set(1.3, 1.3, 1.3); // Slightly larger than original, but fits box
    // No need to rotate the group; axes are now correct
    rocket3dScene.add(rocketGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    rocket3dScene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 5, 5);
    rocket3dScene.add(dirLight);

    rocket3dModel = rocketGroup;

    // --- Add this block for dynamic resizing ---
    function onResize() {
        const container = document.getElementById('rocket3dContainer');
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        rocket3dCamera.aspect = width / height;
        rocket3dCamera.updateProjectionMatrix();
        rocket3dRenderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize);
    // Call once to ensure correct size on load
    onResize();
    // --- End dynamic resizing block ---

    animateRocket3D();
}


function animateRocket3D() {
    requestAnimationFrame(animateRocket3D);
    rocket3dRenderer.render(rocket3dScene, rocket3dCamera);
}