// serviceWorkerRegistration.js - Updated
const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function register(config) {
  // Only register in production and if service workers are supported
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) return;

    window.addEventListener("load", () => {
      const swUrl = `${process.env.PUBLIC_URL}/app-service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            "This web app is being served cache-first by a service worker."
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log("[PWA] Service worker registered successfully", registration);

      // Store the initial state
      if (!window.__initialInstallation) {
        window.__initialInstallation = true;

        // Store current service worker version in sessionStorage
        if (registration.active) {
          try {
            sessionStorage.setItem("swVersion", registration.active.scriptURL);
          } catch (e) {
            console.log("[PWA] Could not store service worker version");
          }
        }
      }

      // Check for updates at appropriate times
      window.addEventListener("online", () => {
        registration.update();
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 1000 * 60 * 60); // Check for updates every hour

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        // Get previously stored SW version
        let previousVersion;
        try {
          previousVersion = sessionStorage.getItem("swVersion");
        } catch (e) {
          console.log("[PWA] Could not get previous service worker version");
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.

              // Compare with current version to avoid showing update for initial installation
              const currentVersion = installingWorker.scriptURL;

              // Only show update notification if there's a real version change
              // and not just a reinstallation of the same version
              if (previousVersion && previousVersion !== currentVersion) {
                console.log(
                  "[PWA] New content is available and will be used when all " +
                    "tabs for this page are closed."
                );

                // Show update notification to the user
                if (config && config.onUpdate) {
                  config.onUpdate(registration);
                }

                // Update the stored version
                try {
                  sessionStorage.setItem("swVersion", currentVersion);
                } catch (e) {
                  console.log("[PWA] Could not update service worker version");
                }
              }
            } else {
              // At this point, everything has been precached.
              console.log("[PWA] Content is cached for offline use.");

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error("[PWA] Error during service worker registration:", error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { "Service-Worker": "script" },
  })
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (
        response.status === 404 ||
        (contentType && contentType.indexOf("javascript") === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        "[PWA] No internet connection found. App is running in offline mode."
      );
    });
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
