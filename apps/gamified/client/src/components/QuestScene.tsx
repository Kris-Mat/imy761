import { createPortal } from 'react-dom';
import {
  FAR_HILL, FRONT_HILL, FRONT_HILL_TEXTURE, MID_HILL, SKY_GRADIENT, type HillCircle
} from '../lib/hillGeometry';
import {
  CAMERA_TRANSITION, CLOUDS, DEPTH, FARM_STATIONS, SUN, flagOpacity, flagScale, layer,
  type CameraTarget, type FarmFlagState
} from '../lib/questScene';
import { useElementSize } from '../hooks/useElementSize';

function Hill({ hill }: { hill: HillCircle; }) {
  return (
    <div
      style={{
        position: 'absolute', left: hill.left, right: hill.right, bottom: hill.bottom, height: hill.height, borderRadius: '50%', background: hill.color
      }}
    />
  );
}

// Same geometry as FRONT_HILL, drawn again on top with a hatched fill —
// this is what gives the front slope the mockup's ploughed-field texture
// instead of a flat colour.
function FrontHillTexture() {
  return (
    <div
      style={{
        position: 'absolute', left: FRONT_HILL.left, right: FRONT_HILL.right, bottom: FRONT_HILL.bottom, height: FRONT_HILL.height, borderRadius: '50%', background: FRONT_HILL_TEXTURE
      }}
    />
  );
}

function Sun() {
  return (
    <div
      style={{
        position: 'absolute',
        top: SUN.top,
        right: SUN.right,
        width: SUN.size,
        height: SUN.size,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 35%, #ffe6cf, #ffd3ae)',
        opacity: 0.85
      }}
    />
  );
}

function Clouds() {
  return (
    <>
      {CLOUDS.map((cloud) => (
        <div
          key={`${cloud.top}-${cloud.left}`}
          style={{
            position: 'absolute',
            top: cloud.top,
            left: cloud.left,
            width: cloud.width,
            height: cloud.height,
            borderRadius: 999,
            background: '#fffaf1',
            opacity: cloud.opacity,
            animation: `quest-cloud-drift ${cloud.durationS}s ease-in-out infinite alternate`
          }}
        />
      ))}
    </>
  );
}

function FarmFlag({ station, state, avatarSrc, alt }: {
  station: { xPct: number; yPct: number; };
  state: FarmFlagState;
  avatarSrc?: string;
  alt: string;
}) {
  const selected = state === 'selected';

  return (
    <div
      style={{
        position: 'absolute', left: `${station.xPct}%`, top: `${station.yPct}%`, transform: 'translate(-50%, -100%)'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 6,
          height: 44,
          opacity: flagOpacity(state),
          transform: `scale(${flagScale(state)})`,
          transformOrigin: 'bottom center',
          transition: 'opacity 400ms ease, transform 400ms ease'
        }}
      >
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, width: 6, height: 44, borderRadius: 999, background: '#8a6b4a'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 38,
            left: '50%',
            width: 46,
            height: 46,
            marginLeft: -23,
            borderRadius: '50%',
            border: '4px solid #fff8f1',
            overflow: 'hidden',
            boxShadow: 'var(--mantine-shadow-sm)',
            transformOrigin: '50% 100%',
            animation: selected
              ? 'quest-flag-wave 1.8s ease-in-out infinite, quest-flag-ring 1.8s ease-out infinite'
              : 'none'
          }}
        >
          {avatarSrc
            ? (
              <img
                src={avatarSrc}
                alt={alt}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 15%'
                }}
              />
            )
            : (
              <div style={{
                width: '100%', height: '100%', background: '#dcd3c4'
              }}
              />
            )}
        </div>
      </div>
    </div>
  );
}

interface QuestSceneProps {
  cameraTarget: CameraTarget;
  // One entry per farm station, in the same order as FARM_STATIONS (i.e.
  // farms sorted by orderIndex) — index i's state/avatar drives FARM_STATIONS[i].
  flagStates: FarmFlagState[];
  farmAvatars: { src?: string; alt: string; }[];
}

// Fixed-position full-bleed background, portalled to document.body for the
// same reason StaticMountainScene is (escapes Layout's ScrollSmoother
// transform, which would otherwise turn `position: fixed` into
// `position: absolute` relative to the transformed ancestor). Rendered only
// on the Quests page in place of StaticMountainScene, so there's exactly one
// fixed background mounted at a time — no double-up between the two.
function QuestScene({ cameraTarget, flagStates, farmAvatars }: QuestSceneProps) {
  const [containerRef, size] = useElementSize<HTMLDivElement>();

  return createPortal(
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', background: SKY_GRADIENT
      }}
    >
      <div
        style={{
          position: 'absolute', inset: 0, transform: layer(cameraTarget, DEPTH.far, size), transition: CAMERA_TRANSITION
        }}
      >
        <Sun />
        <Clouds />
        <Hill hill={FAR_HILL} />
      </div>
      <div
        style={{
          position: 'absolute', inset: 0, transform: layer(cameraTarget, DEPTH.mid, size), transition: CAMERA_TRANSITION
        }}
      >
        <Hill hill={MID_HILL} />
      </div>
      <div
        style={{
          position: 'absolute', inset: 0, transform: layer(cameraTarget, DEPTH.hill, size), transition: CAMERA_TRANSITION
        }}
      >
        <Hill hill={FRONT_HILL} />
        <FrontHillTexture />
        {FARM_STATIONS.map((station, index) => (
          <FarmFlag
            key={`${station.xPct}-${station.yPct}`}
            station={station}
            state={flagStates[index] ?? 'none-selected'}
            avatarSrc={farmAvatars[index]?.src}
            alt={farmAvatars[index]?.alt ?? 'Farm'}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

export default QuestScene;
