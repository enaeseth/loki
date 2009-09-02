/*
 * Loki: a JavaScript WYSIWYG HTML editor with a focus on semantic markup.
 *
 * Copyright © 2006-2009 Carleton College.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 59 Temple
 * Place, Suite 330, Boston, MA 02111-1307 USA
 */

//= require "core/mb.js"
//= require "core/tinymce.js"
//= require "core/Util.js"
//= require "core/UI.js"

var Loki = {
	/**
	 * Converts the given textarea to an instance of the Loki WYSIWYG editor.
	 * @param {HTMLTextAreaElement} area a TEXTAREA element or the ID of one
	 * @param {object} [settings] Loki settings
	 * @param {function} [callback] a function that will be called when the
	 *        conversion is finished
	 * @see UI.Loki#init
	 * @see http://code.google.com/p/loki-editor/wiki/Settings
	 * @returns {void}
	 */
	convert_textarea: function loki_convert_textarea(area, settings,
		callback)
	{
		Loki.convert_textareas([area], settings || {}, callback || null);
	},
	
	/**
	 * Converts the given textareas to instances of the Loki WYSIWYG editor.
	 * @param {HTMLTextAreaElement[]} areas an array of TEXTAREA elements to
	 * convert, or the ID's of the elements
	 * @param {object} [settings] Loki settings
	 * @param {function} [callback] a function that will be called as the
	 *        conversions are finished
	 * @see UI.Loki#init
	 * @see http://code.google.com/p/loki-editor/wiki/Settings
	 * @returns {void}
	 */
	convert_textareas: function loki_convert_textareas(areas, settings,
		callback)
	{	
		var area;
		var instance;
		
		for (var i = 0; i < areas.length; i++) {
			if (typeof(areas[i]) == 'string') {
				area = document.getElementById(areas[i]);
				if (!area) {
					if (Loki._loaded) {
						throw new Error('No element with the ID of "' +
							areas[i] + '" exists in the document.');
					}
					Loki._pend(areas[i], settings || {}, callback || null);
					continue;
				}
			} else {
				area = areas[i];
			}
			
			if (!Util.Node.is_tag(area, "TEXTAREA")) {
				throw new TypeError("Unable to convert a non-textarea to a " +
					"Loki instance.");
			}
			
			instance = (new UI.Loki).init(area, settings || {});
			
			if (callback) {
				callback(instance, area);
			}
		}
	},
	
	/**
	 * Converts all of the textareas in the document which have the specified
	 * class(es).
	 * @param {string} classes	one or more class names
	 * @param {object} [settings] Loki settings
	 * @param {function} [callback] a function that will be called as the
	 *        conversions are finished
	 * @returns {void}
	 */
	convert_textareas_by_class: function loki_convert_classed_textareas(classes,
		settings, callback)
	{
		function get_textareas()
		{
			return Util.Element.find_by_class(document, classes);
		}
		
		if (this._loaded) {
			Loki.convert_textareas(get_textareas(), settings, callback);
		} else {
			Loki._pend(get_textareas, settings || {}, callback || null);
		}
	},
	
	/**
	 * Converts all of the textareas on the document into Loki instances.
	 * @param {object} [settings] Loki settings
	 * @param {function} [callback] a function that will be called as the
	 *        conversions are finished
	 * @see UI.Loki#init
	 * @see http://code.google.com/p/loki-editor/wiki/Settings
	 * @returns {void}
	 */
	convert_all_textareas: function loki_convert_all_textareas(settings,
		callback)
	{
		if (this._loaded) {
			Loki.convert_textareas(document.getElementsByTagName("TEXTAREA"),
				settings || {}, callback);
		} else {
			Loki._pend(null, settings || {}, callback || null);
		}
		
	},
	
	/**
	 * Returns true if the DOM is ready.
	 * @returns {boolean}
	 */
	is_document_ready: function is_document_ready()
	{
		return this._loaded;
	},
	
	/**
	 * The Loki version.
	 * @type string
	 */
	version: "$Rev$",
	
	/** @private */
	_pending: [],
	/** @private */
	_loaded: false,
	
	/** @private */
	_pend: function loki_pend_textarea(area, settings, callback) {
		this._pending.push([area, settings, callback]);
	},
	
	/** @private */
	_finish_conversions: function loki_finish_conversions() {
		var a;
		
		if (this._loaded)
			return false;
		this._loaded = true;
		
		while (a = this._pending.pop()) {
			if (a[0] == null) {
				Loki.convert_all_textareas(a[1], a[2]);
				return true;
			} else if (typeof(a[0]) == 'function') {
				Loki.convert_textareas(a[0](), a[1], a[2]);
			} else {
				Loki.convert_textarea(a[0], a[1], a[2]);
			}
		}
		
		return true;
	}
};

(function loki_wait_for_load() {
	var done = Loki._finish_conversions.bind(Loki);
	Util.Event.observe(document, 'DOMContentLoaded', done);
	Util.Event.observe(window, 'load', done);
})();
