import AppRoutes from './routes';
import { Toaster } from './components/ui/toaster';
import './index.css';

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}

export default App;


