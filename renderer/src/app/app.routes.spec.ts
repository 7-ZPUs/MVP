import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
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

  it('should redirect from empty path to /integrity-dashboard', async () => {
    await router.navigate(['']);
    expect(location.path()).toBe('/integrity-dashboard');
  });

  it('should load verification routes when navigating to /integrity-dashboard', async () => {
    // This requires checking the configuration
    const integrityRoute = router.config.find((route) => route.path === 'integrity-dashboard');
    expect(integrityRoute).toBeTruthy();
    expect(integrityRoute?.loadChildren).toBeDefined();

    // Check if loadChildren is a function
    if (integrityRoute && integrityRoute.loadChildren) {
      expect(typeof integrityRoute.loadChildren).toBe('function');
    }
  });
});
