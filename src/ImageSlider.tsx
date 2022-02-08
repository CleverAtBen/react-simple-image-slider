import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

import ImageSliderNavigation, { ImageSliderNavDirection, ImageSliderNavStyle } from './ImageSliderNavigation';
import ImageSliderBullets from './ImageSliderBullets';
import useSlideIndex from './hooks/useSlideIndex';
import styles from './ImageSliderStyle';
import ImagePreLoader from './ImageSliderPreLoader';

export type SimpleImageSliderProps = {
  width: number | string;
  height: number | string;
  images: Array<{ url: string }>;
  style?: React.CSSProperties;
  showNavs: boolean;
  showBullets: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  autoPlayDelay?: number;
  startIndex?: number;
  slideDuration?: number;
  bgColor?: string;
  useGPURender?: boolean;
  navSize?: number;
  navMargin?: number;
  navStyle?: ImageSliderNavStyle;
  onClick?: (idx: number, event: React.SyntheticEvent) => void;
  onClickNav?: (toRight: boolean) => void;
  onClickBullets?: (idx: number) => void;
  onStartSlide?: (idx: number, length: number) => void;
  onCompleteSlide?: (idx: number, length: number) => void;
};

newValue;

const SimpleImageSlider: React.FC<SimpleImageSliderProps> = ({
  width,
  height,
  images,
  showNavs,
  showBullets,
  loop = true,
  autoPlay = false,
  autoPlayDelay = 2.0,
  startIndex = 0,
  style = undefined,
  slideDuration = 0.5,
  bgColor = '#000',
  useGPURender = true,
  navSize = 50,
  navMargin = 30,
  navStyle = ImageSliderNavStyle.NORMAL,
  onClick = undefined,
  onClickNav = undefined,
  onClickBullets = undefined,
  onStartSlide = undefined,
  onCompleteSlide = undefined
}: SimpleImageSliderProps) => {
  const rootStyle: React.CSSProperties = useMemo(() => styles.getRootContainer(width, height, bgColor), [width, height, bgColor]);
  const { slideIdx, updateSlideIdx, isRightDirection, getNextLoopingIdx, previousSlideIdx } = useSlideIndex({
    imageCount: images.length,
    startIndex,
    autoPlay,
    autoPlayDelay: autoPlayDelay + slideDuration
  });
  const [currentSliderStyle, setCurrentSlideStyle] = useState(styles.getImageSlide(images[0].url, slideDuration, 0, useGPURender));
  const [nextSliderStyle, setNextSliderStyle] = useState(styles.getImageSlide(images[1]?.url, slideDuration, 1, useGPURender));
  const isSlidingRef = useRef(false);

  const handleClick = useCallback(
    (event: React.SyntheticEvent) => {
      onClick?.(slideIdx, event);
    },
    [slideIdx]
  );

  const handleClickNav = useCallback(
    (direction: ImageSliderNavDirection) => () => {
      if (isSlidingRef.current) {
        return;
      }
      const isRight: boolean = direction === ImageSliderNavDirection.RIGHT;

      onClickNav?.(isRight);
      updateSlideIdx(isRight ? slideIdx + 1 : slideIdx - 1);
    },
    [onClickNav, slideIdx, updateSlideIdx]
  );

  const handleClickBullets = useCallback(
    (idx: number) => {
      if (idx === slideIdx || isSlidingRef.current) {
        return;
      }

      onClickBullets?.(idx);
      updateSlideIdx(idx);
    },
    [onClickBullets, slideIdx, updateSlideIdx]
  );

  useEffect(() => {
    if (slideIdx === previousSlideIdx) {
      return;
    }

    const currentUrl: string = images[getNextLoopingIdx(isRightDirection ? slideIdx - 1 : slideIdx + 1)].url;
    const nextUrl: string = images[slideIdx].url;
    const currentOffsetX: 1 | -1 = isRightDirection ? -1 : 1;
    const nextReadyOffsetX: 1 | -1 = isRightDirection ? 1 : -1;

    onStartSlide?.(slideIdx + 1, images.length);
    setNextSliderStyle(styles.getImageSlide(nextUrl, 0, nextReadyOffsetX, useGPURender));
    setTimeout(() => {
      isSlidingRef.current = true;
      setCurrentSlideStyle(styles.getImageSlide(currentUrl, slideDuration, currentOffsetX, useGPURender));
      setNextSliderStyle(styles.getImageSlide(nextUrl, slideDuration, 0, useGPURender));
    }, 50);
  }, [onStartSlide, slideIdx, isRightDirection]);

  const handleSlideEnd = useCallback(() => {
    isSlidingRef.current = false;
    ImagePreLoader.load(images[slideIdx + 2]?.url);
    setCurrentSlideStyle(styles.getImageSlide(images[slideIdx].url, 0, 0, useGPURender));
    onCompleteSlide?.(slideIdx + 1, images.length);
  }, [onCompleteSlide, slideIdx]);

  return (
    <div style={{ ...rootStyle, ...style }}>
      <div style={styles.getSubContainer(width, height)}>
        {/* Render Slider */}
        <div style={styles.ImageSlider} onClick={handleClick} className="rsis-container">
          <div style={currentSliderStyle} onTransitionEnd={handleSlideEnd} className="rsis-image" />
          {images.length > 1 && <div style={nextSliderStyle} />}
        </div>

        {/* Render Navigation */}
        {(loop || slideIdx > 0) && (
          <ImageSliderNavigation
            direction={ImageSliderNavDirection.LEFT}
            visible={showNavs && images.length > 0}
            type={navStyle}
            size={navSize}
            margin={navMargin}
            onClickNav={handleClickNav}
          />
        )}
        {(loop || slideIdx < images.length - 1) && (
          <ImageSliderNavigation
            direction={ImageSliderNavDirection.RIGHT}
            visible={showNavs && images.length > 0}
            type={navStyle}
            size={navSize}
            margin={navMargin}
            onClickNav={handleClickNav}
          />
        )}

        <ImageSliderBullets visible={showBullets} length={images.length} currentIdx={slideIdx} onClickBullets={handleClickBullets} />
      </div>
    </div>
  );
};

export default SimpleImageSlider;
