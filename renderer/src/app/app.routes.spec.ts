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

  it('should load verification routes when navigating to /integrity-dashboard', async () => {
    const rootRoute = router.config.find((route) => route.path === '');
    const integrityRoute = rootRoute?.children?.find(
      (route) => route.path === 'integrity-dashboard',
    );

    expect(rootRoute).toBeTruthy();
    expect(integrityRoute).toBeTruthy();
    expect(integrityRoute?.loadChildren).toBeDefined();

    if (integrityRoute && integrityRoute.loadChildren) {
      expect(typeof integrityRoute.loadChildren).toBe('function');
    }
  });
});
