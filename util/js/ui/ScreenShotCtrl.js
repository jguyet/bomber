bombermine.controller('ScreenShotCtrl', function($scope, $rootScope, $location, storage) {
/*$scope.showServerList = function() {
        if ($rootScope.showGame) {
            $scope.serverList = true; //room
        }
        if (!$rootScope.showGame) {
            $scope.serverList = false; //server
        }
    }*/
    $scope.Screenshot = false;
    $scope.showScreenshot = function() {
        $scope.Screenshot = !($scope.Screenshot);
    }
    /*slider*/
    $scope.$slideIndex = 0;
    $scope.slides = [];

    // функция переключения слайда
    $scope.next = function() {
        var total = $scope.slides.length;
        if (total > 0) {
            $scope.$slideIndex = ($scope.$slideIndex == total - 1) ? 0 : $scope.$slideIndex + 1;
        }
    };
    $scope.last = function() {
        var total = $scope.slides.length;
        if (total > 0) {
            $scope.$slideIndex = ($scope.$slideIndex == 0) ? total - 1 : $scope.$slideIndex - 1;
        }
    };
    $scope.clickLiSlider = function(i) {
        $scope.$slideIndex = i;
    };
    // функция play запускает таймер, который переключает слайд и вызывает её же повторно
    /*$scope.play = function() {
         timeOut = $timeout(function() {
             $scope.next();
             $scope.play();
         }, 2000);
    };*/
    /*end slider*/

    /*screenshot canvas*/
    $scope.scr = function() {

        var canvas0 = $('#layer0')[0]; //изображение поля
        var canvas1 = $('#layer1')[0]; //изображение игроков
        //создаю по объекту изображение на каждую картинку
        var image0 = canvas0.toDataURL('image/png');
        var imageObj0 = new Image();
        imageObj0.src = image0;
        imageObj0.width = canvas0.width;
        imageObj0.height = canvas0.height;

        var image1 = canvas1.toDataURL('image/png');
        var imageObj1 = new Image();
        imageObj1.src = image1;
        imageObj1.width = canvas1.width;
        imageObj1.height = canvas1.height;

        //создаю новый обект canvas
        var canvas = document.createElement('canvas');
        canvas.width = canvas0.width;
        canvas.height = canvas0.height;
        var context = canvas.getContext('2d');
        //добавляю изображения
        context.drawImage(imageObj0, 0, 0);
        context.drawImage(imageObj1, 0, 0);
        //получаем изображение
        var data = canvas.toDataURL('image/png');
        //удалением canvas
        canvas.remove();

        //засылаем картинку на сервер
        /*$.post('saveCPic.php',{data:data}, function(rep){
             
        });*/
        if ($scope.saveImg(data) == true) {
            alert('Изображение сохранено');
            $scope.addSliders();
        }
    }

    $scope.saveImg = function(img) {
        //console.log(img);
        if(typeof(localStorage) == 'undefined' ) {
            alert('Ваш браузер не поддерживает localStorage()');
            return false;
        }
        else {
            try {
                var arrImg = localStorage.img ? JSON.parse(localStorage.img) : [];
                arrImg.push(img);
                //localStorage.img = ;
                localStorage.setItem('img', JSON.stringify(arrImg)); //сохраняет изображение по ключу img
            }
            catch (e) {
                if (e == QUOTA_EXCEEDED_ERR) {
                    alert('Кончилось место'); //данные не сохранены, так как кончилось доступное место
                    return false;
                }
            }
            return true;
            //alert(localStorage.getItem('name')); //Hello World!
            //localStorage.removeItem('name'); //удаляет значение по ключу name
        }
    }
    $scope.deleteSlide = function(i) {
        var arrImg = localStorage.img ? JSON.parse(localStorage.img) : [];
        if (arrImg.length == 0) {
            return false;
        }
        arrImg.splice(i, 1);
        localStorage.setItem('img', JSON.stringify(arrImg)); //записали новый массив
        alert('Элемент удалён');
        if (i == arrImg.length) {
            $scope.$slideIndex = 0;//когда удаляется последний элемент из массива, чтобы слайдер не терялся
        }
        $scope.addSliders();
    }
    $scope.saveSlide = function(i) {
        alert('save');
    }


    $scope.addSliders = function() {
        $scope.slides = [];
        var arrImg = config.localStorage && localStorage.img ? JSON.parse(localStorage.img) : [];
        for (var i = 0; i < arrImg.length; i++) {
            $scope.slides.push({'image': arrImg[i]});            
        }

    }
    $scope.addSliders();
    /*end screenshot*/
});