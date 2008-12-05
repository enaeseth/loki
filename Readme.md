Loki 3.0
========

### A WYSIWYG browser-based semantic HTML editor. ###

Copyright © 2006 Carleton College.

1 North College Street
Northfield, MN 55057-4001
United States of America

About
-----

Loki is a visual (WYSIWYG) HTML editor. Many such editors exist, but Loki is
different: it encourages authors to produce semantic HTML. Here's how:

* ### HTML is cleaned automatically. ###
  
  Loki enforces many of HTML's rules on where inline content can go. Inline
  content that is inserted directly under the `body` or in a `div` are wrapped
  in paragraphs. List items and table cells that have content separated by
  multiple line breaks have that content split into paragraphs.
  
  Loki also performs many other cleanups: it greatly reduces the cruft of HTML
  produced by Microsoft Office products, it formats and indents the HTML it
  produces, it prevents elements from being nested improperly, and it can
  restrict which tags and inline CSS styles are permitted.

* ### Hitting return produces a new paragraph. ###
  
  When typing normal text in Loki, hitting the `Return` key will create a new
  paragraph instead of a line break. Users must work harder to insert an actual
  `br` tag.
  
* ### Images must have alternate text. ###
  
  Loki ensures that your pages remain accessible to visually-impaired visitors,
  search engines, and mobile users by requiring that images have alternate text.
  
* ### Block quotations are clearly quotations. ###
  
  Other editors encourage abuse of the `blockquote` tag by allowing users to
  create indentation with it, but Loki's block-quotation tool is clearly
  labelled with its intended purpose. Loki's indent/outdent tools only function
  within lists.
  
* ### Semantic, accessible use of tables is encouraged. ###
  
  Table summaries and headers are included whenever a table is created.
  Presentational attributes are not included in the markup, and creation of
  tables with two or more rows and columns is encouraged.
  
* ### No frivolous features. ###
  
  Loki is largely free of presentational features: users cannot arbitrarily
  change fonts or colors, and they certainly can't do far more horrible things
  like insert smilies. If you want such features out of the box, Loki is
  probably not for you.
  
But Loki is more than semantic, it's also extremely powerful, with a rich plugin
system. All of Loki's core features are built with this system, so anything that
we were able to do, you can do.

Compatibility
-------------

Loki is compatible with Internet Explorer ≥ 6, Safari ≥ 3, Mozilla Firefox ≥ 2 (et. al.), and Google Chrome.

Getting Help
------------

There is a [Loki installers Google Group][group] where you can post any
questions and be answered by either a developer or another user. Release
announcements are also posted to this list.

Installation
------------

_If you have downloaded a source-code release of Loki, please read the
"building" section below first._

Loki's installation documents are available [online at Google Code][install].

Building
--------

While Loki is distributed with all of its scripts pressed into one JavaScript
file, its actual development is spread across many other files in the `src/`
and `plugins/` directories. Loki uses [Rake][rake] as its automated build
system, and requires Rake, Ruby (≥ 1.8.6), and Haml to build.

Once you have these dependencies, building Loki is simple: just run `rake` in
the top-level Loki directory, and a ready-to-use Loki environment will be
produced at `build/`.

License
-------

Loki is distributed under the terms of the GNU Lesser General Public License
(GNU LGPL) version 2.1. 

See license.txt for the full text of the license under which Loki is
distributed.

[group]: http://groups.google.com/group/loki-installers
[install]: http://code.google.com/p/loki-editor/wiki/Installation
[rake]: http://rake.rubyforge.org/
