var MediaCache = {

  _entries: {},

  _maxAgeMs: 300000,

  get: function(key) {
    this._age();
    var entry = this._entries[key];
    if (entry) {
      entry.hitMs = Date.now();
      return entry.image;
    }
  },

  set: function(key, image) {
    this._entries[key] = {
      hitMs: Date.now(),
      image: image
    };
    this._age();
  },

  _age: function() {
    var cutoffMs = Date.now() - this._maxAgeMs;
    Object.keys(this._entries).forEach(function(key) {
      if (this._entries[key].hitMs < cutoffMs) {
        delete this._entries[key];
      }
    }.bind(this));
  }

}

export default MediaCache;