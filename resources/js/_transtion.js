import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import vertexShader from '../shaders/vertex.glsl?raw';
import fragmentShader from '../shaders/fragment.glsl?raw';
import gsap from 'gsap';
import { $canvas, $container, areaWidth, areaHeight } from './main';

export const Transition = function () {
  let renderer, scene, camera, light, controls,textureLoader;
  let cameraFovY;
  let pageOffsetHeight;
  let isRequestRender = false;

  const scrollSize = [
    { name: 'noise',  element: document.querySelector('.noise'),  top: 0, bottom: 0 },
    { name: 'perlin',  element: document.querySelector('.perlin'),  top: 0, bottom: 0 },
    { name: 'squares', element: document.querySelector('.squares'), top: 0, bottom: 0 },
    { name: 'cells',   element: document.querySelector('.cells'),   top: 0, bottom: 0 },
    { name: 'slope',   element: document.querySelector('.slope'),   top: 0, bottom: 0 },
    { name: 'zoom',    element: document.querySelector('.zoom'),    top: 0, bottom: 0 },
  ];

  let planeGeometry = null,
      planeMaterial = null,
      plane = null;
  const planeSize = { box: null, height: 0, depth: 0 }

  const imageDetails = { width: 0, height: 0, aspectRatio: 0 }
  const imageInfos = [
    { id: 1, path: '/resources/images/img1.jpg', texture: null, mesh: null },
    { id: 2, path: '/resources/images/img2.jpg', texture: null, mesh: null },
    { id: 3, path: '/resources/images/img3.jpg', texture: null, mesh: null },
    { id: 4, path: '/resources/images/img4.jpg', texture: null, mesh: null },
    { id: 5, path: '/resources/images/img1.jpg', texture: null, mesh: null },
    { id: 6, path: '/resources/images/img2.jpg', texture: null, mesh: null },
    { id: 7, path: '/resources/images/img3.jpg', texture: null, mesh: null },
  ];
  const transitionInfos = [
    { path: '/resources/transition/noise.jpg', texture: null },
    { path: '/resources/transition/transition1.png', texture: null },
    { path: '/resources/transition/transition2.png', texture: null },
    { path: '/resources/transition/transition3.png', texture: null },
    { path: '/resources/transition/transition4.png', texture: null },
    { path: '/resources/transition/transition5.png', texture: null },
    { path: '/resources/transition/transition6.png', texture: null },
  ]
  
  const init = function () {
    // Window
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
      item.texture = textureLoader.load(item.path, (tex) => {
        if ( idx !== 0 ) return;
        imageDetails.width = tex.image.width;
        imageDetails.height = tex.image.height;
        imageDetails.aspectRatio = tex.image.height / tex.image.width;

        create3dImage();
        resize();
      });
    });

    transitionInfos.forEach((item, idx) => {
      if ( item.texture ) item.texture.dispose();
      item.texture = textureLoader.load(item.path);
    });
  }

  const create3dImage = function () {
    planeGeometry = new THREE.PlaneGeometry(1, 1);
    planeMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        u_texture1: { value: imageInfos[0].texture },
        u_texture2: { value: imageInfos[1].texture },
        u_transitionTexture: { value: transitionInfos[0].texture },
        u_transitionShow: { value: 1 },
        u_slopeShow: { value: 0 },
        u_zoomShow: { value: 0 },
        u_progress: { value: 0 },
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
    pageOffsetHeight = $container.offsetHeight - areaHeight;

    for (let i = 0; i < scrollSize.length; i++) {
      const scrollItem = scrollSize[i];

      const elemTop = scrollItem.element.offsetTop;
      const elemHeight = scrollItem.element.offsetHeight;

      scrollItem.top = elemTop;
      scrollItem.bottom = elemTop + elemHeight;
    }
    
    // three
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
    if ( planeMaterial ) {
    
      for (let i = 0; i < scrollSize.length; i++) {
        const scrollItem = scrollSize[i];
        
        if ( 
          window.scrollY > scrollItem.top - 20 && 
          window.scrollY < scrollItem.top + areaHeight + 20
        ) {
          const progress = Math.max(0, Math.min(1, (window.scrollY - scrollItem.top) / areaHeight));

          planeMaterial.uniforms.u_texture1.value = imageInfos[i].texture;
          planeMaterial.uniforms.u_texture2.value = imageInfos[i + 1].texture;
          planeMaterial.uniforms.u_progress.value = progress;

          if ( scrollItem.name == 'slope' ) {
            planeMaterial.uniforms.u_transitionShow.value = 0;
            planeMaterial.uniforms.u_slopeShow.value = 1;
            planeMaterial.uniforms.u_zoomShow.value = 0;
          } else if ( scrollItem.name == 'zoom' ) {
            planeMaterial.uniforms.u_transitionShow.value = 0;
            planeMaterial.uniforms.u_slopeShow.value = 0;
            planeMaterial.uniforms.u_zoomShow.value = 1;
          } else {
            planeMaterial.uniforms.u_transitionTexture.value = imageInfos[i].texture;
            planeMaterial.uniforms.u_transitionShow.value = 1;
            planeMaterial.uniforms.u_slopeShow.value = 0;
            planeMaterial.uniforms.u_zoomShow.value = 0;
          }
        }
      }
    }
  }
  
  init();
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', scroll);
}