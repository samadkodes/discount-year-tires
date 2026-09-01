/* =============================================================================
   TIRE DATA LAYER  (data.js)
   -----------------------------------------------------------------------------
   The ONE place the frontend gets tire data from. Everything else (the product
   finder, the quote prefill) talks to window.TyreAPI and never touches the data
   source directly.

   TODAY:   TyreAPI.search() reads a static inventory.json from the same origin.
   LATER:   point DATA_SOURCE at a FastAPI endpoint (e.g. '/api/tires' or
            'https://api.discountyeartires.com/tires'). As long as that endpoint
            returns the same JSON shape ({ tires: [ ... ] }), NOTHING else in the
            frontend has to change.

   The record shape is intentionally flat and database-friendly — each object is
   one row of a future `tires` table:
     id, brand, model, width, aspect, rim, loadIndex, speedRating,
     season, seasonLabel, price, currency, stock, condition, image, description
   ========================================================================== */
(function () {
  'use strict';

  // ---- CONFIG: the only line to change when moving to a real backend --------
  // Same-origin static file today. For FastAPI later, set e.g.:
  //   const DATA_SOURCE = '/api/tires';
  // and (optionally) SEARCH_ON_SERVER = true to let the backend do the filtering.
  const DATA_SOURCE       = 'inventory.json';
  const SEARCH_ON_SERVER  = false;   // false = fetch all once, filter in-browser
  // ---------------------------------------------------------------------------

  let _cache = null;        // resolved inventory array (client-side mode)
  let _inflight = null;     // de-dupes concurrent first calls

  /** Load the inventory once and reuse it. Returns a promise of the array. */
  function load() {
    if (_cache) return Promise.resolve(_cache);
    if (_inflight) return _inflight;

    _inflight = fetch(DATA_SOURCE, { headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('inventory fetch failed: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        // Accept either { tires: [...] } or a bare [...] so a future API is free
        // to return whichever it likes.
        _cache = Array.isArray(data) ? data : (data.tires || []);
        return _cache;
      })
      .catch(function (err) {
        _inflight = null;   // allow a retry on the next call
        throw err;
      });

    return _inflight;
  }

  /**
   * Find tires matching a decoded size.
   * @param {{width:number, aspect:number, rim:number}} size
   * @param {object} [opts]  optional future filters (brand, season, maxPrice…)
   * @returns {Promise<Array>} matching tire records, ordered for display
   */
  function search(size, opts) {
    opts = opts || {};

    // SERVER MODE (future): hand the whole query to the backend untouched.
    if (SEARCH_ON_SERVER) {
      const qs = new URLSearchParams(Object.assign({
        width: size.width, aspect: size.aspect, rim: size.rim
      }, opts)).toString();
      return fetch(DATA_SOURCE + '?' + qs, { headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('search failed'); return r.json(); })
        .then(function (d) { return Array.isArray(d) ? d : (d.tires || []); });
    }

    // CLIENT MODE (today): load once, filter in memory.
    return load().then(function (all) {
      let out = all.filter(function (t) {
        return t.width === size.width && t.aspect === size.aspect && t.rim === size.rim;
      });

      if (opts.brand)  out = out.filter(function (t) { return t.brand === opts.brand; });
      if (opts.season) out = out.filter(function (t) { return t.season === opts.season; });

      // Display order: in-stock first, then by price ascending.
      // NB: use a lookup that tolerates a missing key WITHOUT the falsy-zero
      // trap — `rank[x] || 3` would turn in-stock's legitimate 0 into 3 and
      // sort it last, so an explicit "is it known?" check is required.
      const rank = { 'in-stock': 0, 'low-stock': 1, 'order-in': 2 };
      const rankOf = function (stock) {
        return Object.prototype.hasOwnProperty.call(rank, stock) ? rank[stock] : 3;
      };
      out.sort(function (a, b) {
        const s = rankOf(a.stock) - rankOf(b.stock);
        return s !== 0 ? s : a.price - b.price;
      });
      return out;
    });
  }

  /** Look up a single tire by id (used by the quote prefill). */
  function byId(id) {
    return load().then(function (all) {
      return all.find(function (t) { return t.id === id; }) || null;
    });
  }

  // Warm the cache during idle time so the first search feels instant, without
  // competing with the page's initial render.
  function preload() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(function () { load().catch(function () {}); }, { timeout: 3000 });
    } else {
      setTimeout(function () { load().catch(function () {}); }, 1500);
    }
  }

  window.TyreAPI = { search: search, byId: byId, load: load, preload: preload };
})();
