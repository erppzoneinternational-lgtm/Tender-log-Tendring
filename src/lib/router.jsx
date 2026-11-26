import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const [searchParams, setSearchParamsState] = useState(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setSearchParamsState(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to, options = {}) => {
    if (typeof window === 'undefined') return;
    
    const [pathPart, queryPart] = to.split('?');
    const newPath = pathPart || '/';
    
    if (options.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }

    setCurrentPath(newPath);
    setSearchParamsState(new URLSearchParams(queryPart || ''));
  }, []);

  const setSearchParam = useCallback((key, value) => {
    const params = new URLSearchParams(window.location.search);
    if (value === null || value === undefined) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const newQuery = params.toString();
    const newUrl = window.location.pathname + (newQuery ? '?' + newQuery : '');
    window.history.pushState({}, '', newUrl);
    setSearchParamsState(params);
  }, []);

  return (
    <RouterContext.Provider value={{
      currentPath,
      path: currentPath,
      searchParams,
      navigate,
      setSearchParam
    }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

export function NavLink({ to, className, children, onClick, ...props }) {
  const { navigate } = useRouter();

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) onClick(e);
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}
