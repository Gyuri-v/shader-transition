precision mediump float;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform sampler2D u_transitionTexture;
uniform float u_transitionShow;
uniform float u_slopeShow;
uniform float u_zoomShow;
uniform float u_progress;

varying vec2 v_uv;

// zoom - distort
// https://www.imaginationtech.com/blog/speeding-up-gpu-barrel-distortion-correction-in-mobile-vr/
vec2 distort(vec2 uv, float progress) {
  uv = uv * 2.0 - 1.0;
  vec2 distorted = uv / (1.0 - progress * length(uv));
  return (distorted + 1.0) * 0.5;
}

void main () {
  vec4 transitionColor = texture2D(u_transitionTexture, v_uv);

  float threshold = 0.2;
  float progress = u_progress * (1.0 + threshold * 2.0) - threshold; // -0.2 ~ 1.2
  float transition = 0.0; 
  // clamp(a:현재값, b:최소값, c:최대값) 
  // clamp 하지않으면 transitionColor.r=0 -> -1~6 / itionColor.r=1 -> -6~1 --- 각각 다르게 증가할듯
  // threshold로 위의 수식을 해주지 않으면 transitionColor.r=0 -> 0~1 - 얘만 증가하고 / itionColor.r=1 -> -1~0 -> 0->0

  // 1. TransitionTexture
  float transition1 = clamp((progress - transitionColor.r) * (1.0 / threshold), 0.0, 1.0) * u_transitionShow;

  // 2. Slope
  float transition2 = v_uv.x - v_uv.y * 2.0 + u_progress * 3.1 - 0.55;
  transition2 = smoothstep(0.45, 0.55, transition2) * u_slopeShow;

  // 3. Zoom
  float progress2 = smoothstep(0.5, 1.0, u_progress);
  float transition3 = progress2 * u_zoomShow;

  // color
  vec4 color1;
  vec4 color2;
  color1 = texture2D(u_texture1, v_uv) * u_transitionShow;
  color2 = texture2D(u_texture2, v_uv) * u_transitionShow;
  color1 += texture2D(u_texture1, v_uv) * u_slopeShow;
  color2 += texture2D(u_texture2, v_uv) * u_slopeShow;
  color1 += texture2D(u_texture1, distort(v_uv, -10.0 * u_progress)) * u_zoomShow;
  color2 += texture2D(u_texture2, distort(v_uv, -10.0 * (1.0 - progress2))) * u_zoomShow;

  transition = transition1 + transition2 + transition3;

  gl_FragColor = mix(color1, color2, transition);
}