import '../css/style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import vertexShader from '../shaders/vertex.glsl?raw';
import fragmentShader from '../shaders/fragment.glsl?raw';
import gsap from 'gsap';
import dat from 'dat.gui';

const DEBUG = location.search.indexOf('debug') > -1;

const App = function () {
  let areaWidth:number, areaHeight:number;
  let renderer, scene, camera, light, controls, gui, textureLoader;
  let cameraFovY:number;
  let pageOffsetHeight:number;
  let isRequestRender = false;

  const $container = document.querySelector('.container') as HTMLElement;
  const $canvas = document.querySelector('canvas.webgl') as HTMLElement;

  let planeGeometry = null as Object3D,
      planeMaterial = null as Object3D,
      plane = null as Object3D;
  const planeSize = { box: null as Object3D, height: 0 as number, depth: 0 as number }

  const imageDetails = { width: 0, height: 0, aspectRatio: 0 }
  const imageInfos = [
    { id: 1, path: 'resources/images/img1.jpg', texture: null as any, mesh: null as any },
    { id: 2, path: 'resources/images/img2.jpg', texture: null as any, mesh: null as any },
    { id: 3, path: 'resources/images/img3.jpg', texture: null as any, mesh: null as any },
  ];

  const transitionArray = [
    'resources/transition/noise.jpg',
    'resources/transition/transition1.png',
    'resources/transition/transition2.png',
    'resources/transition/transition3.png',
    'resources/transition/transition4.png',
    'resources/transition/transition5.png',
    'resources/transition/transition6.png',
  ]
  
  const init = function () {
    // Window
    areaWidth = window.innerWidth;
    areaHeight = window.innerHeight;
    pageOffsetHeight = $container.offsetHeight - areaHeight;

    // Scene
    scene = new THREE.Scene();

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: $canvas, antialias: true, alpha: true });
    renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) );
    renderer.setClearColor('#000', 1.0);
    renderer.setSize(areaWidth, areaHeight);

    // Camera
    camera = new THREE.PerspectiveCamera(75, areaWidth/areaHeight, 1, 100);
    camera.position.set(0, 0, 1);
    cameraFovY = camera.position.z * camera.getFilmHeight() / camera.getFocalLength();

    // Light
    light = new THREE.AmbientLight('#fff', 1);
    scene.add(light);

    // Loader
    textureLoader = new THREE.TextureLoader();

    // Controls
    // controls = new OrbitControls(camera, $canvas);
    // controls.addEventListener('change', renderRequest);

    // Setting
    setImages();

    // Loading
    renderRequest();
    render();
    THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
      console.log(itemsLoaded, itemsTotal);
      if ( itemsLoaded === itemsTotal ) {
        renderRequest();
        render();
      }
    }
  }

  // Setting
  const setImages = function () {
    imageInfos.forEach((item, idx) => {
      if ( item.texture ) item.texture.dispose();
      item.texture = textureLoader.load(item.path, (tex:any) => {
        if ( idx !== 0 ) return;
        imageDetails.width = tex.image.width;
        imageDetails.height = tex.image.height;
        imageDetails.aspectRatio = tex.image.height / tex.image.width;

        create3dImage();
        resize();
      });
    });
  }

  const create3dImage = function () {
    planeGeometry = new THREE.PlaneGeometry(1, 1);
    planeMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        u_texture1: { value: imageInfos[0].texture },
        u_texture2: { value: imageInfos[1].texture },
        u_texture3: { value: imageInfos[2].texture },
        u_transitionTexture: { value: textureLoader.load(transitionArray[0]) },
        u_progress: { value: 0.6 },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    plane = new THREE.Mesh(planeGeometry, planeMaterial);

    scene.add(plane);
    resize();
  }

  // Resize
  const resize = function () {
    areaWidth = window.innerWidth;
    areaHeight = window.innerHeight;
    pageOffsetHeight = $container.offsetHeight - areaHeight;
    
    camera.aspect = areaWidth / areaHeight;
    camera.updateProjectionMatrix();

    // 화면에 fit하게 맞추기
    if ( areaHeight/areaWidth < imageDetails.aspectRatio ) {
      const fitRatio = cameraFovY * camera.aspect;
      plane.scale.set(fitRatio, fitRatio, 1);
    } else {
      const fitRatio = cameraFovY / imageDetails.aspectRatio;
      plane.scale.set(fitRatio, fitRatio, 1);
    }
    
    renderer.setSize(areaWidth, areaHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    renderRequest();
  }

  // Render
  const renderRequest = function () {
    isRequestRender = true;
  }

  const render = function () {
    if ( isRequestRender ) {
      renderer.setSize(areaWidth, areaHeight);
      renderer.render(scene, camera);
    }
    window.requestAnimationFrame(render);
  }

  // Scroll
  const scroll = function () {
    const progress = window.scrollY / pageOffsetHeight;
    
    if ( planeMaterial ) {
      planeMaterial.uniforms.u_progress.value = progress;
    }
  }
  
  window.addEventListener('load', init);
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', scroll);
}
App();