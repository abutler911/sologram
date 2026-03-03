// navigation/AppNav.js
// Thin orchestrator — owns state, delegates rendering to sub-components.
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaLightbulb,
  FaFolder,
  FaUser,
  FaCamera,
  FaImages,
  FaRobot,
  FaArchive,
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';

import TopBar from './TopBar';
import Sidebar from './Sidebar';
import BottomBar from './BottomBar';
import SearchOverlay from './SearchOverlay';
import CreateSheet from './CreateSheet';
import CommandPalette from './CommandPalette';
import CrazyPlane from './CrazyPlane';
import EasterEggModal from '../easter/EasterEggModal';
import Fireworks from '../easter/Fireworks';

const AppNav = ({ onSearch, onClearSearch }) => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const canCreate =
    isAuthenticated && (user?.role === 'admin' || user?.role === 'creator');

  // ── Overlay state ──────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // ── Easter egg state ───────────────────────────────────────────────────────
  const [easterEggOpen, setEasterEggOpen] = useState(false);
  const [planeVisible, setPlaneVisible] = useState(false);
  const [fireworksVisible, setFireworksVisible] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const pressTimer = useRef(null);
  const didLongPress = useRef(false);

  const onLogoPointerDown = useCallback(() => {
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setPlaneVisible(true);
      tapCount.current = 0;
      clearTimeout(tapTimer.current);
    }, 600);
  }, []);

  const onLogoPressCancel = useCallback(() => {
    clearTimeout(pressTimer.current);
  }, []);

  const onLogoClick = useCallback((e) => {
    if (didLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    tapCount.current += 1;

    if (tapCount.current === 4) {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => {
        if (tapCount.current === 4) setEasterEggOpen(true);
        tapCount.current = 0;
      }, 400);
      return;
    }

    if (tapCount.current >= 7) {
      e.preventDefault();
      e.stopPropagation();
      tapCount.current = 0;
      clearTimeout(tapTimer.current);
      setFireworksVisible(true);
      return;
    }

    if (tapCount.current > 4) {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 400);
      return;
    }

    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(tapTimer.current);
      clearTimeout(pressTimer.current);
    };
  }, []);

  const logoEasterEgg = {
    onPointerDown: onLogoPointerDown,
    onPointerUp: onLogoPressCancel,
    onPointerLeave: onLogoPressCancel,
    onClick: onLogoClick,
    onContextMenu: (e) => e.preventDefault(),
  };

  // ── Sync URL search param ─────────────────────────────────────────────────
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('search') || '';
    setSearchQuery(q);
    if (location.pathname === '/' && q && onSearch) onSearch(q);
  }, [location, onSearch]);

  // ── Close overlays on navigation ──────────────────────────────────────────
  useEffect(() => {
    setCreateOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // ── Auto-focus search input ───────────────────────────────────────────────
  useEffect(() => {
    if (searchOpen)
      requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [searchOpen]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((s) => !s);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setCreateOpen(false);
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isActive = useCallback(
    (path) =>
      path === '/'
        ? location.pathname === '/' && !location.search.includes('search=')
        : location.pathname.startsWith(path),
    [location]
  );

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  const triggerSearch = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      onSearch?.(q);
      if (location.pathname !== '/')
        navigate('/?search=' + encodeURIComponent(q));
    } else {
      onClearSearch?.();
    }
    setSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onClearSearch?.();
    searchInputRef.current?.focus();
  };

  const goCreate = (to) => {
    setCreateOpen(false);
    navigate(to);
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';

  // ── Command palette items ─────────────────────────────────────────────────
  const paletteItems = useMemo(() => {
    const base = [
      { label: 'Home', icon: <FaHome />, to: '/' },
      { label: 'Thoughts', icon: <FaLightbulb />, to: '/thoughts' },
      { label: 'Collections', icon: <FaFolder />, to: '/collections' },
      { label: 'Profile', icon: <FaUser />, to: '/profile' },
      { label: 'Story Archive', icon: <FaArchive />, to: '/story-archive' },
    ];
    if (canCreate)
      base.push(
        { label: 'New Post', icon: <FaCamera />, to: '/create' },
        { label: 'New Story', icon: <FaImages />, to: '/create-story' },
        {
          label: 'New Thought',
          icon: <FaLightbulb />,
          to: '/thoughts/create',
        },
        {
          label: 'New Collection',
          icon: <FaFolder />,
          to: '/collections/create',
        }
      );
    if (isAdmin)
      base.push(
        { label: 'Media Gallery', icon: <FaImages />, to: '/media-gallery' },
        { label: 'AI Content', icon: <FaRobot />, to: '/admin/ai-content' }
      );
    return base;
  }, [canCreate, isAdmin]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <TopBar
        logoEasterEgg={logoEasterEgg}
        canCreate={canCreate}
        isActive={isActive}
        isAuthenticated={isAuthenticated}
        initials={initials}
        onNavigateProfile={() => navigate('/profile')}
      />

      <Sidebar
        logoEasterEgg={logoEasterEgg}
        isActive={isActive}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        canCreate={canCreate}
        user={user}
        initials={initials}
        onLogout={doLogout}
        onSearchOpen={() => setSearchOpen(true)}
        onCreateOpen={() => setCreateOpen(true)}
        onPaletteOpen={() => setPaletteOpen(true)}
      />

      <BottomBar
        isActive={isActive}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        canCreate={canCreate}
        initials={initials}
        searchOpen={searchOpen}
        onSearchOpen={() => setSearchOpen(true)}
        onCreateOpen={() => setCreateOpen(true)}
      />

      {searchOpen && (
        <SearchOverlay
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchInputRef={searchInputRef}
          onSubmit={triggerSearch}
          onClear={clearSearch}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {createOpen && (
        <CreateSheet
          canCreate={canCreate}
          onNavigate={goCreate}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {paletteOpen && (
        <CommandPalette
          items={paletteItems}
          onClose={() => setPaletteOpen(false)}
          navigate={navigate}
        />
      )}

      {easterEggOpen && (
        <EasterEggModal onClose={() => setEasterEggOpen(false)} />
      )}
      {planeVisible && <CrazyPlane onDone={() => setPlaneVisible(false)} />}
      {fireworksVisible && (
        <Fireworks onDone={() => setFireworksVisible(false)} />
      )}
    </>
  );
};

export default AppNav;
