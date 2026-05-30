import { useEffect } from 'react';
import AppRouter from './routes/AppRouter.jsx';
import { useAuthStore } from './store/useAuthStore.js';

const App = () => {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return <AppRouter />;
};

export default App;
