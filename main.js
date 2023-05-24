if (jsb) {
    var searchPaths = jsb.fileUtils.getSearchPaths();
    var oldVersion = localStorage.getItem('hot_update_version');
    oldVersion = oldVersion || '1.0.0';
    console.log('old version = ', oldVersion);
    if (oldVersion && searchPaths.length > 0) {
        var path = searchPaths[searchPaths.length - 1];
        if (jsb.fileUtils.isFileExist(path + 'src/local_config.json')) {
            var config = jsb.fileUtils.getStringFromFile(path + 'src/local_config.json');
            config = JSON.parse(config);
            if (config) {
                var packageVersion = config.PACKAGE_VERSION;
                console.log('package version = ', packageVersion);

                var bNeedClear = false;
                var vA = oldVersion.split('.');
                var vB = packageVersion.split('.');
                for (var i = 0; i < vA.length; ++i) {
                    var a = parseInt(vA[i]);
                    var b = parseInt(vB[i] || 0);
                    if (a === b) {
                        continue;
                    } else {
                        bNeedClear = a < b;
                        console.log('compare version: ', a, b, bNeedClear);
                        break;
                    }
                }

                if (bNeedClear) {
                    var oldPath = jsb.fileUtils.getWritablePath() + 'hall';
                    console.log('removeDirectory ', oldPath);
                    var removeResult = jsb.fileUtils.removeDirectory(oldPath);
                    console.log('removeResult = ', removeResult);

                    var oldSilencePath = jsb.fileUtils.getWritablePath() + 'silence';
                    console.log('removeSilenceDirectory ', oldSilencePath);
                    var removeSilenceResult = jsb.fileUtils.removeDirectory(oldSilencePath);
                    console.log('removeSilenceResult = ', removeSilenceResult);

                    localStorage.setItem('hot_update_version', packageVersion);
                    console.log('set hot update version = ', packageVersion);
                }
            }
        } else {
            console.log('can not find local config file...');
        }
    }

    listFilesRecursively = function (filePath, arr) {
        if (!jsb.fileUtils.isAbsolutePath(filePath)) {
            filePath = jsb.fileUtils.fullPathForFilename(filePath);
        }

        var filePaths = jsb.fileUtils.listFiles(filePath);
        for (let i = 0; i < filePaths.length; i++) {
            if (-1 != filePaths[i].search(/\/[\.]+\//)) {
                console.log('path =>>>> ', filePaths[i]);
            } else {
                if (jsb.fileUtils.isDirectoryExist(filePaths[i])) {
                    console.log('path =>> ', filePaths[i]);
                    arr.push(filePaths[i]);
                    listFilesRecursively(filePaths[i], arr);
                } else {
                    console.log('path => ', filePaths[i]);
                    if (jsb.fileUtils.isFileExist(filePaths[i])) {
                        console.log('path = ', filePaths[i]);
                        arr.push(filePaths[i]);
                    }
                }
            }
        }
    };

    var hotUpdateSearchPaths = localStorage.getItem('hotUpdateSearchPaths');
    if (hotUpdateSearchPaths) {
        hotUpdateSearchPaths = JSON.parse(hotUpdateSearchPaths);
        var storagePath = jsb.fileUtils.getWritablePath() + 'hall/';
        jsb.fileUtils.createDirectory(storagePath);
        var bFind = false;
        var newSearchPaths = hotUpdateSearchPaths.filter(function (path) {
            console.log('search path = ', path);
            if (-1 != path.search('/silence/')) {
                console.log('is silence file...');
                if (jsb.fileUtils.isDirectoryExist(path)) {
                    // Merging all files in temp storage path to storage path
                    var files = [];
                    listFilesRecursively(path, files);
                    console.log(path);
                    console.log(files);
                    var baseOffset = path.length;
                    var relativePath = '';
                    var dstPath = '';
                    for (let i = 0; i < files.length; i++) {
                        console.log('file path = ', files[i]);
                        relativePath = files[i].slice(baseOffset);
                        dstPath = storagePath + relativePath;
                        // Create directory
                        if (relativePath.slice(-1) == '/') {
                            console.log('create directory = ', dstPath);
                            jsb.fileUtils.createDirectory(dstPath);
                        }
                        // Copy file
                        else {
                            if (jsb.fileUtils.isFileExist(dstPath)) {
                                console.log('remove file = ', dstPath);
                                jsb.fileUtils.removeFile(dstPath);
                            }
                            console.log('rename old file = ', files[i]);
                            console.log('rename tar file = ', dstPath);
                            jsb.fileUtils.renameFile(files[i], dstPath);
                        }
                    }
                    // Remove temp storage path
                    jsb.fileUtils.removeDirectory(path);
                }

                return false;
            } else {
                console.log('not silence file...');

                if (storagePath == path) {
                    bFind = true;
                }

                return true;
            }
        })
        if (!bFind) {
            newSearchPaths.unshift(storagePath);
        }
        jsb.fileUtils.setSearchPaths(newSearchPaths);
        console.log('hall main.js...');
        console.log(newSearchPaths);

        localStorage.setItem('hotUpdateSearchPaths', JSON.stringify(newSearchPaths));
    }

    localStorage.removeItem('hotUpdateSearchPathsLast');
}

window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;
    var onProgress = null;

    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;

    // var settingPath = settings.debug ? 'src/settings.js' : 'src/settings.jsc';

    // var hotUpdateSearchPaths = localStorage.getItem('OverseasAppHotUpdateSearchPaths');
    // if (hotUpdateSearchPaths) {
    //     var paths = JSON.parse(hotUpdateSearchPaths);
    //     console.log(paths);
    //     if (paths.length >= 2) {
    //         for (let i = paths.length - 1; i >= 0; i--) {
    //             console.log(paths[i]);
    //             if (!jsb.fileUtils.isFileExist(paths[i] + settingPath)) {
    //                 console.log(paths[i], 'not found...');
    //                 continue;
    //             }
    //             require(paths[i] + settingPath);
    //             var tmpSetting = window._CCSettings;
    //             window._CCSettings = undefined;
    //             console.log(tmpSetting);

    //             for (var assetkey in tmpSetting.packedAssets) {
    //                 settings.packedAssets[assetkey] = tmpSetting.packedAssets[assetkey];
    //             }

    //             for (var uuidKey in tmpSetting.rawAssets.assets) {
    //                 settings.rawAssets.assets[uuidKey] = tmpSetting.rawAssets.assets[uuidKey];
    //             }

    //             for (var sceneKey in tmpSetting.scenes) {
    //                 settings.scenes.push(tmpSetting.scenes[sceneKey]);
    //             }

    //             console.log(settings);
    //         }
    //     }
    // }

    // cc.hall = settings;

    // console.log('settings', JSON.stringify(settings));

    function setLoadingDisplay () {
        // Loading splash scene
        var splash = document.getElementById('splash');
        var progressBar = splash.querySelector('.progress-bar span');
        onProgress = function (finish, total) {
            var percent = 100 * finish / total;
            if (progressBar) {
                progressBar.style.width = percent.toFixed(2) + '%';
            }
        };
        splash.style.display = 'block';
        progressBar.style.width = '0%';

        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            splash.style.display = 'none';
        });
    }

    var onStart = function () {
        //cc.loader.downloader._subpackages = settings.subpackages;

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        if (cc.sys.isBrowser) {
            setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
            if (settings.orientation === 'landscape') {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            } else if (settings.orientation === 'portrait') {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }
            cc.view.enableAutoFullScreen([
                cc.sys.BROWSER_TYPE_BAIDU,
                cc.sys.BROWSER_TYPE_BAIDU_APP,
                cc.sys.BROWSER_TYPE_WECHAT,
                cc.sys.BROWSER_TYPE_MOBILE_QQ,
                cc.sys.BROWSER_TYPE_MIUI,
                cc.sys.BROWSER_TYPE_HUAWEI,
                cc.sys.BROWSER_TYPE_UC,
            ].indexOf(cc.sys.browserType) < 0);
        }

        // Limit downloading max concurrent task to 2,
        // more tasks simultaneously may cause performance draw back on some android system / browsers.
        // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
        if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
            cc.assetManager.downloader.maxConcurrency = 2;
            cc.assetManager.downloader.maxRequestsPerFrame = 2;
        }

        var launchScene = settings.launchScene;
        var bundle = cc.assetManager.bundles.find(function (b) {
            return b.getSceneInfo(launchScene);
        });

        bundle.loadScene(launchScene, null, onProgress,
            function (err, scene) {
                if (!err) {
                    cc.director.runSceneImmediate(scene);
                    if (cc.sys.isBrowser) {
                        // show canvas
                        var canvas = document.getElementById('GameCanvas');
                        canvas.style.visibility = '';
                        var div = document.getElementById('GameDiv');
                        if (div) {
                            div.style.backgroundImage = '';
                        }
                        console.log('Success to load scene: ' + launchScene);
                    }
                }
            }
        );

    };

    var option = {
        id: 'GameCanvas',
        //scenes: settings.scenes,
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        //jsList: jsList,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    };

    cc.assetManager.init({
        bundleVers: settings.bundleVers,
        remoteBundles: settings.remoteBundles,
        server: settings.server
    });

    var bundleRoot = [INTERNAL];
    settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

    var count = 0;
    function cb (err) {
        if (err) {return console.error(err.message, err.stack);}
        count++;
        if (count === bundleRoot.length + 1) {
            cc.assetManager.loadBundle(MAIN, function (err) {
                if (!err) {cc.game.run(option, onStart);}
            });
        }
    }

    cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x;}), cb);

    for (var i = 0; i < bundleRoot.length; i++) {
        cc.assetManager.loadBundle(bundleRoot[i], cb);
    }
};

if (window.jsb) {
    var isRuntime = (typeof loadRuntime === 'function');
    if (isRuntime) {
        require('src/settings.js');
        require('src/cocos2d-runtime.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/engine/index.js');
    } else {
        require('src/settings.js');
        require('src/cocos2d-jsb.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/jsb-engine.js');
    }

    cc.macro.CLEANUP_IMAGE_CACHE = true;
    window.boot();
}