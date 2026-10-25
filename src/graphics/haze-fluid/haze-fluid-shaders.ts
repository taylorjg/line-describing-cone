/**
 * Advection / splat passes adapted from WebGL-Fluid-Simulation (MIT)
 * https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
 */

export const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/** Semi-Lagrangian advection with procedural swirl velocity. */
export const advectDensityFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uDensity;
  uniform float uTime;
  uniform float uDt;
  uniform float uSwirl;
  uniform float uDissipation;
  uniform vec2 uTexelSize;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = vUv;
    float slowTime = uTime * 0.2;
    float n = hash21(uv * 4.2 + slowTime * 0.12);
    float n2 = hash21(uv * 9.3 - slowTime * 0.07 + 19.0);

    float angle =
      slowTime * 0.14 +
      uv.y * 6.28318 * 1.5 +
      (n - 0.5) * 1.1;
    float twist =
      sin(uv.x * 6.28318 * 2.2 + slowTime * 0.22) * 0.32 +
      (n2 - 0.5) * 0.35;
    vec2 velocity =
      vec2(cos(angle + twist), sin(angle * 0.82 + twist * 1.05)) * uSwirl;
    velocity += vec2(n - 0.5, n2 - 0.5) * 0.22 * uSwirl;
    velocity *= mix(0.3, 1.0, uv.y);

    vec2 backtrace = uv - velocity * uDt * uTexelSize * 48.0;
    backtrace = fract(backtrace);

    float d = texture2D(uDensity, backtrace).r;
    d *= uDissipation;
    gl_FragColor = vec4(d, 0.0, 0.0, 1.0);
  }
`;

export const splatDensityFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uDensity;
  uniform vec2 uPoint;
  uniform float uRadius;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    float d = texture2D(uDensity, vUv).r;
    vec2 delta = vUv - uPoint;
    delta.x = min(abs(delta.x), 1.0 - abs(delta.x));
    float dist = length(delta);
    float splat = exp(-dist * dist / uRadius) * uStrength;
    gl_FragColor = vec4(d + splat, 0.0, 0.0, 1.0);
  }
`;

export const clearDensityFragment = /* glsl */ `
  precision highp float;
  uniform float uValue;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(uValue, 0.0, 0.0, 1.0);
  }
`;
