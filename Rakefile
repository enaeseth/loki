require 'rake'
require 'sprockets'

ROOT_DIR = File.expand_path(File.dirname(__FILE__))

task :default => [:build]

task :build => ['loki.js']

file 'loki.js' => Dir['src/**/*.js'] do
  secretary = Sprockets::Secretary.new(
    :root => ROOT_DIR,
    :source_files => ['src/loki.js'] + Dir['src/components/*.js'],
    :strip_comments => true
  )
  
  secretary.concatenation.save_to(File.join(ROOT_DIR, 'loki.js'))
end
