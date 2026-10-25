import * as THREE from "three";

export interface ConeBeamShaderUniforms {
  projectorPosition: { value: THREE.Vector3 };
  lightOpacity: { value: number };
  scatterG: { value: number };
  edgeMix: { value: number };
  falloffPower: { value: number };
  nearBoost: { value: number };
  farAtten: { value: number };
  glareStrength: { value: number };
  membraneMax: { value: number };
  minWeight: { value: number };
  densityMin: { value: number };
  densityMax: { value: number };
  densityContrast: { value: number };
  uHazeDensity: { value: THREE.Texture | null };
  uHazeEnabled: { value: number };
}

export const coneBeamVertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const coneBeamFragmentShader = /* glsl */ `
  uniform vec3 projectorPosition;
  uniform float lightOpacity;
  uniform float scatterG;
  uniform float edgeMix;
  uniform float falloffPower;
  uniform float nearBoost;
  uniform float farAtten;
  uniform float glareStrength;
  uniform float membraneMax;
  uniform float minWeight;
  uniform float densityMin;
  uniform float densityMax;
  uniform float densityContrast;
  uniform sampler2D uHazeDensity;
  uniform float uHazeEnabled;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float henyeyGreenstein(float cosTheta, float g) {
    float gg = g * g;
    return (1.0 - gg) / pow(max(1.0 + gg - 2.0 * g * cosTheta, 1e-4), 1.5);
  }

  void main() {
    vec3 toFrag = vWorldPos - projectorPosition;
    float dist = length(toFrag);

    float t = clamp(vUv.y, 0.0, 1.0);
    float distAtten = mix(farAtten, nearBoost, pow(1.0 - t, falloffPower));

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 beamDir = dist > 1e-5 ? toFrag / dist : vec3(0.0, 0.0, -1.0);
    float cosTheta = dot(beamDir, viewDir);

    vec3 n = gl_FrontFacing ? vNormal : -vNormal;
    float edgeTerm = 1.0 - abs(dot(viewDir, n));
    float phasePeak = henyeyGreenstein(1.0, scatterG);
    float phase = henyeyGreenstein(cosTheta, scatterG) / phasePeak;
    float alongBeam = max(cosTheta, 0.0);
    float glareSuppress = 1.0 - glareStrength * alongBeam * alongBeam;
    float highlight = mix(edgeTerm, phase, edgeMix) * glareSuppress;
    highlight = max(highlight, edgeTerm * 0.78);

    vec2 hazeUv = vec2(vUv.x, vUv.y);
    float fluid = texture2D(uHazeDensity, hazeUv).r;
    fluid = mix(0.55, fluid, uHazeEnabled);

    vec2 noiseCoord = vec2(vUv.y * 48.0, vUv.x * 12.0);
    float grain = valueNoise(noiseCoord);
    grain += 0.35 * valueNoise(noiseCoord * 2.1 + 17.0);
    grain /= 1.35;
    float densityPatch = pow(clamp(grain * 0.35 + fluid * 0.85, 0.0, 1.0), densityContrast);
    float density = mix(densityMin, densityMax, densityPatch);

    float weight = min(
      max(highlight, minWeight * (0.45 + 0.55 * densityPatch)),
      1.0
    );

    float intensity = weight * density * distAtten * membraneMax * lightOpacity;
    vec3 color = vec3(1.0, 1.0, 1.0) * intensity;
    gl_FragColor = vec4(color, intensity);
  }
`;

export function createConeBeamUniforms(
  membraneMax = 1.55
): ConeBeamShaderUniforms {
  const empty = new THREE.DataTexture(new Uint8Array([128]), 1, 1);
  empty.needsUpdate = true;
  return {
    projectorPosition: { value: new THREE.Vector3() },
    lightOpacity: { value: 0 },
    scatterG: { value: 0.68 },
    edgeMix: { value: 0.4 },
    falloffPower: { value: 2.35 },
    nearBoost: { value: 1.45 },
    farAtten: { value: 0.16 },
    glareStrength: { value: 0.28 },
    membraneMax: { value: membraneMax },
    minWeight: { value: 0.45 },
    densityMin: { value: 0.52 },
    densityMax: { value: 1.35 },
    densityContrast: { value: 0.58 },
    uHazeDensity: { value: empty },
    uHazeEnabled: { value: 1 },
  };
}

export function createConeBeamMaterial(
  uniforms: ConeBeamShaderUniforms
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as THREE.ShaderMaterial["uniforms"],
    vertexShader: coneBeamVertexShader,
    fragmentShader: coneBeamFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}
