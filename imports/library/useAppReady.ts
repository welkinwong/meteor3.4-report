import { useEffect } from 'react';
import { setAppReady, useAppDispatch } from '../app/slice';

const useAppReady = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setAppReady());
  }, [dispatch]);
};

export default useAppReady;
