class DicomViewer {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.imageIds = [];
        this.currentImageIndex = 0;
        this.isPlaying = false;
        this.cineTimer = null;
        this.measurements = [];
        this.scale = 1.0;
        this.windowWidth = 400;
        this.windowCenter = 40;

        this.init();
    }

    init() {
        cornerstone.enable(this.element);
        cornerstoneTools.init();

        // Activer les outils
        cornerstoneTools.addTool(cornerstoneTools.LengthTool);
        cornerstoneTools.addTool(cornerstoneTools.AngleTool);
        cornerstoneTools.addTool(cornerstoneTools.PanTool);
        cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
        cornerstoneTools.addTool(cornerstoneTools.ZoomTool);

        cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
        cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });

        // Événements
        this.element.addEventListener('dblclick', () => this.resetViewport());
        this.element.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) this.prevImage();
            else this.nextImage();
        });

        console.log('✅ Lecteur DICOM initialisé');
    }

    loadImages(urls) {
        this.imageIds = urls.map(url => `wadouri:${url}`);
        this.currentImageIndex = 0;

        let loadedCount = 0;
        this.imageIds.forEach((imageId, index) => {
            cornerstone.loadImage(imageId).then(() => {
                loadedCount++;
                console.log(`✅ Image ${index + 1} chargée (${loadedCount}/${this.imageIds.length})`);
                if (index === 0) this.showImage(0);
                this.updateStatusBar();
            }).catch(err => {
                console.error(`❌ Erreur chargement image ${index + 1}:`, err);
                document.getElementById('statusBar').textContent = `❌ Erreur image ${index + 1}`;
            });
        });
    }

    showImage(index) {
        if (index < 0) index = this.imageIds.length - 1;
        if (index >= this.imageIds.length) index = 0;
        this.currentImageIndex = index;
        cornerstone.displayImage(this.element, cornerstone.getImage(this.imageIds[index]));
        this.updateStatusBar();
    }

    updateStatusBar() {
        document.getElementById('statusBar').textContent = `Image ${this.currentImageIndex + 1}/${this.imageIds.length}`;
    }

    nextImage() {
        this.showImage(this.currentImageIndex + 1);
    }

    prevImage() {
        this.showImage(this.currentImageIndex - 1);
    }

    playCine() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.cineTimer = setInterval(() => {
            this.nextImage();
        }, 200);
        document.getElementById('playBtn').textContent = '⏸️ Pause';
    }

    stopCine() {
        clearInterval(this.cineTimer);
        this.isPlaying = false;
        document.getElementById('playBtn').textContent = '▶️ Lecture continue';
    }

    zoomIn() {
        this.scale *= 1.2;
        this.applyTransform();
    }

    zoomOut() {
        this.scale /= 1.2;
        this.applyTransform();
    }

    resetViewport() {
        const viewport = cornerstone.getDefaultViewportForImage(this.element, cornerstone.getImage(this.imageIds[this.currentImageIndex]));
        cornerstone.displayImage(this.element, cornerstone.getImage(this.imageIds[this.currentImageIndex]), viewport);
        this.scale = 1.0;
        this.windowWidth = 400;
        this.windowCenter = 40;
        document.getElementById('windowWidth').value = 400;
        document.getElementById('windowCenter').value = 40;
        this.updateWindowLevelDisplay();
    }

    updateWindowLevel() {
        this.windowWidth = parseInt(document.getElementById('windowWidth').value);
        this.windowCenter = parseInt(document.getElementById('windowCenter').value);
        this.applyTransform();
        this.updateWindowLevelDisplay();
    }

    updateWindowLevelDisplay() {
        document.getElementById('wwValue').textContent = this.windowWidth;
        document.getElementById('wcValue').textContent = this.windowCenter;
    }

    preset(ww, wc) {
        this.windowWidth = ww;
        this.windowCenter = wc;
        document.getElementById('windowWidth').value = ww;
        document.getElementById('windowCenter').value = wc;
        this.updateWindowLevel();
    }

    applyTransform() {
        const viewport = cornerstone.getViewport(this.element);
        viewport.scale = this.scale;
        viewport.voi = { windowWidth: this.windowWidth, windowCenter: this.windowCenter };
        cornerstone.setViewport(this.element, viewport);
    }

    clearMeasurements() {
        cornerstoneTools.clearToolState(this.element, 'length');
        cornerstoneTools.clearToolState(this.element, 'angle');
        this.measurements = [];
        this.updateMeasurementsList();
    }

    updateMeasurementsList() {
        const list = document.getElementById('measurementsList');
        list.innerHTML = '';
        if (this.measurements.length === 0) {
            list.innerHTML = '<p>Aucune mesure enregistrée</p>';
            return;
        }
        this.measurements.forEach((m, i) => {
            const item = document.createElement('div');
            item.className = 'measurement-item';
            item.textContent = m;
            list.appendChild(item);
        });
    }
}

// Initialiser après chargement
document.addEventListener('DOMContentLoaded', function() {
    const viewer = new DicomViewer('dicomImage');

    // Charger les images
    const urls = {{ dicom_urls | tojson }};
    if (urls && urls.length > 0) {
        viewer.loadImages(urls);
    } else {
        document.getElementById('statusBar').textContent = '❌ Aucun fichier DICOM trouvé';
    }

    // Événements
    document.getElementById('playBtn')?.addEventListener('click', () => viewer.playCine());
    document.getElementById('stopBtn')?.addEventListener('click', () => viewer.stopCine());
    document.getElementById('prevBtn')?.addEventListener('click', () => viewer.prevImage());
    document.getElementById('nextBtn')?.addEventListener('click', () => viewer.nextImage());
    document.getElementById('zoomInBtn')?.addEventListener('click', () => viewer.zoomIn());
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => viewer.zoomOut());
    document.getElementById('resetBtn')?.addEventListener('click', () => viewer.resetViewport());
    document.getElementById('panBtn')?.addEventListener('click', () => {
        cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 });
    });
    document.getElementById('lengthBtn')?.addEventListener('click', () => {
        cornerstoneTools.setToolActive('Length', { mouseButtonMask: 1 });
    });
    document.getElementById('angleBtn')?.addEventListener('click', () => {
        cornerstoneTools.setToolActive('Angle', { mouseButtonMask: 1 });
    });
    document.getElementById('clearBtn')?.addEventListener('click', () => viewer.clearMeasurements());
    document.getElementById('windowWidth')?.addEventListener('input', () => viewer.updateWindowLevel());
    document.getElementById('windowCenter')?.addEventListener('input', () => viewer.updateWindowLevel());
    document.getElementById('softTissueBtn')?.addEventListener('click', () => viewer.preset(400, 40));
    document.getElementById('boneBtn')?.addEventListener('click', () => viewer.preset(2000, 400));
    document.getElementById('lungBtn')?.addEventListener('click', () => viewer.preset(1500, -600));
});