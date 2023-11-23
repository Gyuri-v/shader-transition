import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import dat from 'dat.gui';
import { $canvas, $container, areaWidth, areaHeight } from './main';

export const Fake3d = function () {
  let renderer, scene, camera, light, controls, gui, textureLoader;
  let cameraFovY;
  let isRequestRender = false;

  // Main settings
  const settings = {
    xThreshold: 20,
    yThreshold: 35,
    originImagePath: '/resources/images/obock-origin.jpg',
    depthImagePath: '/resources/images/obock-depth.jpg',
    // originImagePath: 'https://assets.codepen.io/122136/dog-photo.jpg',
    // depthImagePath: 'https://assets.codepen.io/122136/dog-depth-map.jpg',
  }

  // Image Details
  let originImage = null;
  let depthImage = null;
  const originImageDetails = { width: 0, height: 0, aspectRatio: 0 }

  // Geometries and Material
  let planeGeometry = null;
  let planeMaterial = null;
  let plane = null;

  // Cursor Settings
  const cursor = {
    x: 0,
    y: 0,
    lerpX: 0,
    lerpY: 0,
  }

  // * Init
  const init = function () {
    
    // scene
    scene = new THREE.Scene();

    // renderer
    renderer = new THREE.WebGLRenderer({ canvas: $canvas, antialias: true, alpha: true });
    renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2) );
    renderer.setClearColor('#000', 1.0);
    renderer.setSize(areaWidth, areaHeight);
    
    // camera
    camera = new THREE.PerspectiveCamera(75, areaWidth/areaHeight, 1, 100);
    camera.position.set(0, 0, 1.7);
    scene.add(camera);

    cameraFovY = camera.position.z * camera.getFilmHeight() / camera.getFocalLength();
    // filmGauge : 더 큰 축에 사용되는 필름 크기. 기본값은 35
    // getFilmHeight : 필름의 이미지 높이를 반환. aspect가 1보다 작거나 같은 경우는 filmGauge와 같은 결과를 가짐
    // getFocalLength : filmGauge 기준으로 현재 fov의 초점 거리를 반환
    // console.log('camera.position.z', camera.position.z, ' || filmGauge-', camera.filmGauge, ' || getFilmHeight-', camera.getFilmHeight(), ' || getFilmWidth', camera.getFilmWidth(), ' || getFocalLength-',camera.getFocalLength(), ' || fov-',camera.fov, ' || cameraFovY-',cameraFovY);
    // console.log('cameraFovX', camera.position.z * camera.getFilmWidth() / camera.getFocalLength(), THREE.MathUtils.radToDeg(camera.position.z * camera.getFilmWidth() / camera.getFocalLength()), THREE.MathUtils.radToDeg(camera.position.z * camera.getFilmHeight() / camera.getFocalLength()));
    
    // light
    // light = new THREE.AmbientLight('#fff', 1);
    // scene.add(light);
    
    // controls
    // controls = new OrbitControls(camera, $canvas);
    // controls.addEventListener('change', renderRequest);

    // loader
    textureLoader = new THREE.TextureLoader();
    
    // helper
    gui = new dat.GUI();
    gui.add(settings, 'xThreshold').min(0).max(50).step(1).onFinishChange(setImages).name('X Threshold')
    gui.add(settings, 'yThreshold').min(0).max(50).step(1).onFinishChange(setImages).name('Y Threshold')
    
    // render
    setImages();

    // Loading
    THREE.DefaultLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
      if (itemsLoaded === itemsTotal) {
        renderRequest();
        render();
      }
    }
  }

  // Setting
  const setImages = function () {
    if ( originImage !== null || depthImage !== null ) {
      originImage.dispose();
      depthImage.dispose();
    }
    depthImage = textureLoader.load(settings.depthImagePath);
    originImage = textureLoader.load(settings.originImagePath, function (tex) {
      originImageDetails.width = tex.image.width;
      originImageDetails.height = tex.image.height;
      originImageDetails.aspectRatio = tex.image.height / tex.image.width;

      create3dImage();
      resize();
    })
  }

  const create3dImage = function () {

    if ( plane !== null ) {
      planeGeometry.dispose();
      planeMaterial.dispose();
      scene.remove(plane);
    }

    planeGeometry = new THREE.PlaneGeometry(1, 1.3);
    planeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        originTexture: { value: originImage },
        depthTexture: { value: depthImage },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uThreshold: { value: new THREE.Vector2( settings.xThreshold, settings.yThreshold ) }
      },
      vertexShader: `
        varying vec2 vUv;

        void main () {
          vUv = uv;

          vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewPosition;
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform sampler2D originTexture;
        uniform sampler2D depthTexture;
        uniform vec2 uMouse;
        uniform vec2 uThreshold;

        varying vec2 vUv;

        vec2 mirrored(vec2 v) {
          vec2 m = mod(v, 2.0);
          return mix(m, 2.0-m , step(1.0, m));
          // mod(a, b) : a를 b로 나눈 나머지 ----- m: 시작점 / 2.0-m : 끝점을 계산한거임
          // step(0.5, x) : 0.5 보다 x 가 크면 1, 아니면 0 --- 보간하는데 사용할 값계산을 한거임
          // mix(a, b, c) : a(시작점)와 b(끝점)를 c만큼 보간
        }

        void main () {
          vec4 depthMap = texture2D(depthTexture, mirrored(vUv));
          vec2 fake3d = vec2(vUv.x + (depthMap.r - 0.5) * uMouse.x / uThreshold.x, vUv.y + (depthMap.r - 0.5) * uMouse.y / uThreshold.y);

          gl_FragColor = texture2D(originTexture, mirrored(fake3d));
          
          // 테스트
          // gl_FragColor = texture2D(depthTexture, vUv);
          // gl_FragColor = texture2D(depthTexture, mirrored(vUv));
          // vec2 test3d = vec2(vUv.x + (depthMap.r - 0.5) * -0.4 / 10.0, vUv.y + (depthMap.r - 0.5) * -0.4 / 10.0 );
          // gl_FragColor = texture2D(originTexture, mirrored(test3d));

          // 설명
          // texture2D(sampler, vec2 형태로 uv값 지정);

        }
      `,
    });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add( plane );
    renderRequest();
  }

  // Resize 
  const resize = function () {
    camera.aspect = areaWidth / areaHeight;
    camera.updateProjectionMatrix();

    // 화면에 fit 하게 맞추기
    // if( areaHeight/areaWidth < originImageDetails.aspectRatio) {
    //   const fitRatio = cameraFovY * camera.aspect;
    //   plane.scale.set( fitRatio, fitRatio, 1 );
    // } else {
    //   const fitRatio = cameraFovY / originImageDetails.aspectRatio;
    //   plane.scale.set( fitRatio, fitRatio, 1 );
    // }
    
    renderer.setSize(areaWidth, areaHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    renderRequest();
  }


  // Render
  const clock = new THREE.Clock();
  let previousTime = 0;

  const renderRequest = function () {
    isRequestRender = true;
  }

  const render = function () {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    if (isRequestRender) {
      const parallaxX = cursor.x * 0.5;
      const parallaxY = -cursor.y * 0.5;
      // 0.5는 임의로 설정한 transition의 강도 같은 거
      
      cursor.lerpX += (parallaxX - cursor.lerpX) * 5 * deltaTime;
      cursor.lerpY += (parallaxY - cursor.lerpY) * 5 * deltaTime;
      // (parallaxX - cursor.lerpX) = 는 그냥 cursor.y에 0.5(강도)를 곱한 값과 동일한데
      // deltaTime 과 5를 곱해서 frame에 따라 transition 느낌 부여
  
      if ( planeMaterial ) planeMaterial.uniforms.uMouse.value = new THREE.Vector2(cursor.lerpX, cursor.lerpY);

      renderer.setSize(areaWidth, areaHeight);
      renderer.render(scene, camera);
    }
    window.requestAnimationFrame(render);
  }


  init();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (event) =>
  {
    cursor.x = event.clientX / areaWidth - 0.5
    cursor.y = event.clientY / areaHeight - 0.5
  })

  window.addEventListener('mouseout', (event) =>
  {
    cursor.x = 0
    cursor.y = 0
  })
  window.addEventListener('touchmove', (event) =>
  {
    const touch = event.touches[0];
    cursor.x = touch.pageX / areaWidth - 0.5;
    cursor.y = touch.pageY / areaHeight - 0.5;
  })

  window.addEventListener('touchend', (event) =>
  {
    cursor.x = 0
    cursor.y = 0
  })
}