require 'rake'
require 'sprockets'
require 'haml'
require 'sass'
require 'ftools'

ROOT_DIR = File.expand_path(File.dirname(__FILE__))
SRC_DIR = File.join(ROOT_DIR, 'src')
BUILD_DIR = File.join(ROOT_DIR, 'build')
STATIC_DIR = File.join(ROOT_DIR, 'static')
STATIC_BUILD_DIR = File.join(BUILD_DIR, 'static')

# Make sure we have a build directory when we build
directory BUILD_DIR

task :build => [BUILD_DIR, File.join(BUILD_DIR, 'loki.js')]

def create_haml_compiler(engine)
  proc do |source, destination|
    contents = File.read(source)
    engine = engine.new(contents)
    FileUtils.mkpath(File.dirname(destination))
    File.open(destination, 'w') { |f| f.write(engine.render) }
  end
end

haml_rules = [
  ['.haml', '.html', create_haml_compiler(Haml::Engine)],
  ['.sass', '.css', create_haml_compiler(Sass::Engine)]
]
haml_rules.each do |source_ext, dest_ext, compiler|
  Dir[File.join(STATIC_DIR, '**/*' + source_ext)].each do |src_path|
    dest_path = src_path.sub(source_ext, dest_ext).
      sub(STATIC_DIR, STATIC_BUILD_DIR)
    file dest_path => [src_path] do
      FileUtils.mkpath(File.dirname(dest_path))
      compiler.call(src_path, dest_path)
    end
    Rake::Task[:build].enhance([dest_path])
  end
end

Dir[File.join(STATIC_DIR, '**', '*.{html,css,png,gif,jpg}')].each do |src_path|
  dest_path = src_path.sub(STATIC_DIR, STATIC_BUILD_DIR)
  file dest_path => [src_path] do
    FileUtils.mkpath(File.dirname(dest_path))
    File.copy(src_path, dest_path)
  end
  Rake::Task[:build].enhance([dest_path])
end

file File.join(BUILD_DIR, 'loki.js') => Dir[File.join(SRC_DIR, '**/*.js')] do
  secretary = Sprockets::Secretary.new(
    :root => ROOT_DIR,
    :source_files => [File.join(SRC_DIR, 'loki.js')] +
      Dir[File.join(SRC_DIR, 'components/*.js')],
    :strip_comments => true
  )
  
  secretary.concatenation.save_to(File.join(BUILD_DIR, 'loki.js'))
end

task :default => [:build]
