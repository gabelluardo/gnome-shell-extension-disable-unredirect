build_dir := "_build"
uuid := "unredirect@vaina.lt"

build: clean
    npx tsc
    cp resources/metadata.json {{build_dir}}/metadata.json
    cp LICENSE {{build_dir}}/LICENSE

check:
    npm run check

install: build
    rm -rf ~/.local/share/gnome-shell/extensions/{{uuid}}
    mkdir -p ~/.local/share/gnome-shell/extensions/{{uuid}}
    cp -r {{build_dir}}/. ~/.local/share/gnome-shell/extensions/{{uuid}}/

pack: build
    cd {{build_dir}} && zip -9r ../{{uuid}}.shell-extension.zip .

clean:
    rm -rf {{build_dir}} {{uuid}}.shell-extension.zip