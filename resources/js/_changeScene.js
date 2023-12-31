import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import vertextChangeScene from '../shaders/vertexChangeScene.glsl?raw';
import fragmentChangeScene from '../shaders/fragmentChangeScene.glsl?raw';
import gsap from 'gsap';
import { $canvas, $container, areaWidth, areaHeight } from './main';

export const ChangeScene = function () {
  console.log('ChangeScene');
  let renderer, scene, camera, light, controls, textureLoader;
  let isRequestRender;
  let plane, cameraFovY;

  const init = function () {
    // renderer
    renderer = new THREE.WebGLRenderer({ canvas: $canvas, antialias: true, alpha: true });
    renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) );
    renderer.setClearColor(0xdddddd, 1.0);
    renderer.setSize(areaWidth, areaHeight);

    // scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(45, areaWidth/areaHeight, 1, 100);
    camera.position.set(0, 0, 1);
    cameraFovY = camera.position.z * camera.getFilmHeight() / camera.getFocalLength();
    
    // Light
    // light = new THREE.AmbientLight('#fff', 1);
    // scene.add(light);

    // Controls
    // controls = new OrbitControls(camera, $canvas);
    // controls.addEventListener('change', renderRequest);

    // Loader
    textureLoader = new THREE.TextureLoader();

    // Setting
    setModel();

    // Loading
    // renderRequest();
    // render();
    THREE.DefaultLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
      if ( itemsLoaded === itemsTotal ) {
        // renderRequest();
      }
    }

    resize();
  }

  // SetModel
  const setModel = function () {
    const planeGeometry = new THREE.PlaneGeometry(1, 1, 50, 50);
    const planeMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        u_texture1: { value: null },
        u_texture2: { value: null },
        u_progress: { value: 0 },
      },
      vertexShader: vertextChangeScene,
      fragmentShader: fragmentChangeScene,
    })
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    
    scene.add(plane);
  }

  // Resize
  const resize = function () {
    camera.aspect = areaWidth / areaHeight;
    camera.updateProjectionMatrix();

    // 화면에 fit하게 맞추기
    if ( areaHeight/areaWidth < 1 ) {
      const fitRatio = cameraFovY * camera.aspect;
      plane.scale.set(fitRatio, fitRatio, 1);
    } else {
      const fitRatio = cameraFovY / 1;
      plane.scale.set(fitRatio, fitRatio, 1);
    }

    renderer.setSize(areaWidth, areaHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  }

  // Render
  // const renderRequest = function () {
  //   isRequestRender = true;
  // }

  // const render = function () {
  //   if ( isRequestRender ) {
  //     renderer.setSize(areaWidth, areaHeight);
  //     renderer.render(scene, camera);
  //   }
  //   window.requestAnimationFrame(render);
  // }



  // --------------------------------
  // SubRender
  const subScenes = [
    (() => {
      const world = createSubScene('cornflowerblue');

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      world.scene.add(mesh);

      return {
        texture: world.renderTarget.texture,
        update: function (deltaTime) {
          mesh.rotation.x += deltaTime * 0.0005;
          mesh.rotation.y -= deltaTime * 0.0005;
          mesh.rotation.z += deltaTime * 0.0005;
          world.render();
        }
      }
    })(),
    (() => {
      const world = createSubScene('orange');
      
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 16, 10),
        new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
      );
      world.scene.add(mesh);

      return {
        texture: world.renderTarget.texture,
        update: function (deltaTime) {
          mesh.rotation.x += deltaTime * 0.0005;
          mesh.rotation.y -= deltaTime * 0.0005;
          mesh.rotation.z += deltaTime * 0.0005;
          world.render();
        }
      }
    })(),
    (() => {
      const world = createSubScene('indianred');
      
      const mesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.39, 0.17),
        new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })
      );
      world.scene.add(mesh);

      return {
        texture: world.renderTarget.texture,
        update: function (deltaTime) {
          mesh.rotation.x += deltaTime * 0.0005;
          mesh.rotation.y -= deltaTime * 0.0005;
          mesh.rotation.z += deltaTime * 0.0005;
          world.render();
        }
      }
    })()
  ];

  function createSubScene (background) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);

    // const camera = new THREE.PerspectiveCamera(45, areaWidth/areaHeight, 1, 100);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const renderTarget = new THREE.WebGLRenderTarget(1024, 1024);
    // 직접 렌더링 할 수 있는 텍스처

    function render () {
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);
    }

    return { scene, renderTarget, render };
  }

  // Animation
  gsap.ticker.add(animate);
  function animate (time, deltaTime) {

    if ( plane ) {
      const index = Math.floor(plane.material.uniforms.u_progress.value);
      const nextIndex = Math.ceil(plane.material.uniforms.u_progress.value);
      
      subScenes[index].update(deltaTime);
      plane.material.uniforms.u_texture1.value = subScenes[index].texture;
      if ( index !== nextIndex ) {
        subScenes[nextIndex].update(deltaTime);
        plane.material.uniforms.u_texture2.value = subScenes[nextIndex].texture;
      }

      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }
  }

  // Scroll 
  let progress;
  const scroll = function () {
    progress = window.scrollY / ($container.offsetHeight - areaHeight) * 2;
    if ( plane ) plane.material.uniforms.u_progress.value = progress;
  }


  // Event
  init();
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', scroll);
}


