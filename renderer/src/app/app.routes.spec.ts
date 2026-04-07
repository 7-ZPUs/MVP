import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { Location } from '@angular/common';

describe('App /routes', () => {
  let router: Router;
  let location: Location;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should redirect from empty path to /browse', async () => {
    await router.navigate(['']);
    expect(location.path()).toBe('/browse');
  });

  it('should have a lazy loaded search route', async () => {
    const shellRoute = router.config.find((route) => route.path === '');
    const searchRoute = shellRoute?.children?.find((route) => route.path === 'search');
    
    expect(searchRoute).toBeTruthy();
    expect(searchRoute?.loadChildren).toBeDefined();

    if (searchRoute && searchRoute.loadChildren) {
      expect(typeof searchRoute.loadChildren).toBe('function');
    }
  });

  it('should have a lazy loaded detail route', async () => {
    const shellRoute = router.config.find((route) => route.path === '');
    const detailRoute = shellRoute?.children?.find((route) => route.path === 'detail');
    
    expect(detailRoute).toBeTruthy();
    expect(detailRoute?.loadChildren).toBeDefined();

    if (detailRoute && detailRoute.loadChildren) {
      expect(typeof detailRoute.loadChildren).toBe('function');
    }
  });

  it('should load verification routes when navigating to /integrity-dashboard', async () => {
    const shellRoute = router.config.find((route) => route.path === '');
    const integrityRoute = shellRoute?.children?.find((route) => route.path === 'integrity-dashboard');
    
    expect(integrityRoute).toBeTruthy();
    expect(integrityRoute?.loadChildren).toBeDefined();

    if (integrityRoute && integrityRoute.loadChildren) {
      expect(typeof integrityRoute.loadChildren).toBe('function');
    }
  });

  it('should redirect from /dip to /browse', async () => {
    await router.navigate(['/dip']);
    expect(location.path()).toBe('/browse');
  });

  it('should redirect from an unknown path to /browse', async () => {
    await router.navigate(['/unknown-path-for-testing']);
    expect(location.path()).toBe('/browse');
  });
});