import React, { useMemo, useState } from 'react';
import { getMovieImageCandidates } from '../utils/movieImageUtils';

const MoviePoster = ({ movie, alt, className }) => {
  const candidates = useMemo(() => getMovieImageCandidates(movie), [movie]);
  const [index, setIndex] = useState(0);

  const handleError = () => {
    setIndex((prev) => (prev < candidates.length - 1 ? prev + 1 : prev));
  };

  return (
    <img
      src={candidates[index]}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

export default MoviePoster;
