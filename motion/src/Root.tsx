import React from "react";
import { Composition } from "remotion";
import { RivoAd, VIDEO } from "./Video";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="RivoAd"
      component={RivoAd}
      durationInFrames={VIDEO.duration}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
    <Composition
      id="RivoAd16x9"
      component={RivoAd}
      durationInFrames={VIDEO.duration}
      fps={VIDEO.fps}
      width={1920}
      height={1080}
    />
    <Composition
      id="RivoAd1x1"
      component={RivoAd}
      durationInFrames={VIDEO.duration}
      fps={VIDEO.fps}
      width={1080}
      height={1080}
    />
  </>
);
