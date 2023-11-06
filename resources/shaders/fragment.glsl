precision mediump float;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform sampler2D u_texture3;
uniform sampler2D u_transitionTexture;
uniform float u_progress;

varying vec2 v_uv;

void main () {
  vec4 color1 = texture2D(u_texture1, v_uv);
  vec4 color2 = texture2D(u_texture2, v_uv);
  vec4 transitionColor = texture2D(u_transitionTexture, v_uv);

  float threshold = 0.2;
  float progress = u_progress * (1.0 + threshold * 2.0) - threshold; // -0.2 ~ 1.2
  float transition = clamp((progress - transitionColor.r) * (1.0 / threshold), 0.0, 1.0);

  gl_FragColor = mix(color1, color2, transition);
}