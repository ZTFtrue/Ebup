import { AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { MatBottomSheet, MatDialog, MatDrawer } from '@angular/material';
import { TouchEmitter } from './touch-emitter';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DialogSettingsComponent } from './dialog-settings/dialog-settings.component';
import { Settings } from './settings';
// import { ePub  } from '@angular/core';
declare var ePub: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, AfterViewInit {

  // Load the opf
  rendition: any = null;
  book: any = null;
  touchEventStart: TouchEmitter;
  touchEventLast: TouchEmitter;
  navigationData: any = null;
  testUrl: string;
  bookName: string = null;
  searchControl = new FormGroup({
    searchKeyWord: new FormControl(null, [
      Validators.required,
      Validators.nullValidator, Validators.minLength(1), Validators.maxLength(2000)
    ]),
    searchAll: new FormControl(false, [])
  });
  location: any;
  resItems: any = null;
  searching = false;
  search = false;
  showMainSearchButton = false;

  @ViewChild('inputfile', { static: false }) inputfile: ElementRef;
  @ViewChild('drawer', { static: false }) drawer: MatDrawer;
  constructor(
    public dialog: MatDialog,
    public detector: NgZone,
    private bottomSheet: MatBottomSheet,
  ) {
  }
  @HostListener('window:unload', ['$event'])
  unloadHandler(event) {
    // ...
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event) {
    if (this.book) {
      const chars = 1650;
      const key = `${this.book.key()}:locations-${chars}`;
      localStorage.setItem(key, JSON.stringify(this.rendition.currentLocation().end.cfi));
    }
  }
  ngOnInit(): void {

  }
  ngAfterViewInit(): void {
    // this.rendition.themes.default({ "p": { "font-size": "medium !important"}})
    // this.rendition.themes.register("dark", "themes.css");
    // this.rendition.themes.register("light", "themes.css");
    // this.rendition.themes.register("tan", "themes.css");
    //  this.rendition.themes.default({
    //   h2: {
    //     'font-size': '32px',
    //     color: 'purple'
    //   },
    //   p: {
    //     "margin": '10px'
    //   }
    // });
    // this.rendition.themes.select("dark");
    // const displayed = this.rendition.display('epubcfi(/6/14[xchapter_001]!4/2/24/2[c001p0011]/1:799)');
    // displayed.then((renderer: any) => {
    // });
    // 目录
    // this.book.loaded.navigation.then((toc: any) => {
    //   // console.log(toc);
    // });
  }

  uploadFileClick() {
    this.inputfile.nativeElement.click();
  }
  /*
  * 读取文件内容
  */
  processFiles(file: any): void {
    file = file.target.files[0];
    this.bookName = file.name;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.openBook(e);
      };
      reader.readAsArrayBuffer(file);
    }
  }
  openBook(e: any) {

    const bookData = e.target.result;
    this.book = ePub();
    this.book.open(bookData, 'binary');
    this.rendition = this.book.renderTo('viewer', {
      method: 'continuous',
      // method: 'default',
      // manager: 'continuous',
      manager: 'default',
      flow: 'scrolled',
      // flow: 'auto',
      // flow: "paginated",
      width: '100%',
      height: '100%'
    });
    console.log(this.rendition);
    // this.rendition.spread('always',1000);
    // aslo can set px
    const settings = JSON.parse(localStorage.getItem('result'));
    if (settings) {
      this.rendition.themes.fontSize(settings.fontSizeValue);
    } else {
      this.rendition.themes.fontSize('140%');
    }
    this.rendition.display();
    // this.rendition.resize()
    console.log(this.rendition.themes._overrides['font-size'].value);
    this.rendition.hooks.content.register((contents: any) => {
      const el = contents.document.documentElement;
      contents.innerHeight = contents.innerHeight * 2;
      if (el) {
        // Enable swipe gesture to flip a page
        let start: Touch;
        let end: Touch;
        el.addEventListener('touchstart', (event: TouchEvent) => {
          start = event.changedTouches[0];
        });
        // el.addEventListener('click', (event: any) => {
        //   const clientX = event.clientX;
        //   const screenX = event.screenX;
        //   if (clientX > screenX / 5 && clientX < screenX * 4 / 5 &&) {
        //     this.detector.run(() => (this.drawer.toggle()));
        //     event.preventDefault();
        //   }
        // });
        el.addEventListener('touchend', (event: TouchEvent) => {
          end = event.changedTouches[0];
          const screenX = event.view.innerWidth;
          const screenY = event.view.innerHeight;
          const hr = (end.screenX - start.screenX) / screenX;
          const vr = Math.abs((end.screenY - start.screenY) / screenY);
          if (hr > 0.25 && vr < 0.01) { return this.rendition.prev(); }
          if (hr < -0.25 && vr < 0.01) { return this.rendition.next(); }
        });
      }
    });

    this.book.loaded.navigation.then((toc: any) => {
      console.log(toc);
      this.navigationData = toc;
    });
    this.rendition.on('keyup', (event: any) => {
      // Left Key
      if ((event.keyCode || event.which) === 37) {
        this.previewPage();
      }
      // Right Key
      if ((event.keyCode || event.which) === 39) {
        this.nextPage();
      }
    });
    this.rendition.on('relocated', (location: any) => {
      console.log(location);
    });
    this.book.ready.then(() => {
      const chars = 1650;
      const key = `${this.book.key()}:locations-${chars}`;
      const stored = JSON.parse(localStorage.getItem(key));
      if (stored) {
        localStorage.removeItem(key);
        return this.rendition.display(stored);
      }
    });
  }
  nextPage() {
    if (this.rendition) {
      this.rendition.next();
    }
  }
  previewPage() {
    if (this.rendition) {
      this.rendition.prev();
    }
  }
  onKeyUp(event: number) { // without type info
    if (event === 0) {
      this.previewPage();
    } else if (event === 1) {
      this.nextPage();
    }
  }
  touchOnMove(event: TouchEmitter) {
    this.touchEventLast = event;
  }
  touchOnStart(event: TouchEmitter) {
    this.touchEventStart = event;
  }
  touchOnEnd(touchend: TouchEmitter) {
    if (touchend.direction === 0) {
      this.nextPage();
    } else if (touchend.direction === 1) {
      this.previewPage();
    }
  }

  onSubmit(f: any) {
    if (!f.searchKeyWord) {
      return;
    }
    this.searching = true;
    if (f.searchAll) {
      this.doSearch(f.searchKeyWord);
    } else {
      this.doChapterSearch(f.searchKeyWord);
    }
  }
  doSearch(q: string) {
    this.resItems = null;
    Promise.all(
      this.book.spine.spineItems.map(item =>
        item.load(this.book.load.bind(this.book))
          .then(item.find.bind(item, q))
          .finally(item.unload.bind(item))
      )
    ).then(results => {
      const rea = [].concat.apply([], results);
      if (rea.length === 0) {
        this.showMainSearchButton = false;
      } else {
        this.showMainSearchButton = true;
      }
      this.resItems = rea;
      this.searching = false;
    });
  }

  doChapterSearch(q: string) {
    this.resItems = null;
    const item = this.book.spine.get(this.location);
    const res = item.load(this.book.load.bind(this.book)).then(item.find.bind(item, q)).finally(item.unload.bind(item));
    res.then(r => {
      if (r.length === 0) {
        this.showMainSearchButton = false;
      } else {
        this.showMainSearchButton = true;
      }
      this.resItems = r;
      this.searching = false;
    });
  }
  /*
  *0:
  cfi: "epubcfi(/6/10[id4]!/4/8,/1:62,/1:63)"
  excerpt: "...↵我像傻瓜一样混进首吠破的似乎是纯种老北京人开的冷面馆子..."
  */
  selectNavigationForSearch($event, item: any) {
    this.detector.run(() => (this.search = false));
    this.rendition.display(item.cfi);
  }

  selectNavigation(event: any, navigation: any) {
    const url = navigation.href;
    this.testUrl = url;
    this.rendition.display(url);
  }

  fullScreen() {
    const element: any = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    }
  }
  openSettingsDialog() {
    const settings = JSON.parse(localStorage.getItem('result'));
    // if (settings) {
    //   this.rendition.themes.fontSize(settings.fontSizeValue);
    // } else {
    //   this.rendition.themes.fontSize('140%');
    // }
    const dialogRef = this.dialog.open(DialogSettingsComponent, {
      // width: '250px',
      hasBackdrop: false,
      data: this.rendition === null ?
        settings ? { settings: new Settings(settings.fontSizeValue, ''), rendition: this.rendition } : null
        : { settings: new Settings(this.rendition.themes._overrides['font-size'].value, ''), rendition: this.rendition }
    });

    dialogRef.afterClosed().subscribe((result: Settings) => {
      if (result) {
        if (this.rendition) {
          const location = this.rendition.currentLocation().start;
          this.rendition.themes.fontSize(result.fontSizeValue);
          this.rendition.display();
          this.rendition.display(location.cfi);
        }
        localStorage.setItem('result', JSON.stringify(result));
      }
    });
  }
}
