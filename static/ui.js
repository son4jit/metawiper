/**
 * MetaWiper - Modern UI Logic
 * Focus: Micro-interactions, Staggered Animations, Robust State Management
 */

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const previewContainer = document.getElementById("previewContainer");
    const uploadBox = document.getElementById("uploadBox");
    const uploadForm = document.getElementById("mainForm");
    const resultsArea = document.getElementById("resultsArea");
    const analyzeBtn = document.getElementById("analyzeBtn");

    let selectedFiles = [];
    let objectUrls = [];

    // Cleanup Utility
    const revokeAllUrls = () => {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        objectUrls = [];
    };

    // Handle File Selection with Micro-interactions
    const handleFiles = (files) => {
        if (!files || files.length === 0) return;

        revokeAllUrls();
        selectedFiles = Array.from(files);
        previewContainer.innerHTML = '';
        previewContainer.classList.remove('hidden');
        resultsArea.innerHTML = ''; // Clear old results when new files selected

        selectedFiles.forEach((file, index) => {
            const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|tiff|bmp)$/i.test(file.name);

            if (isImage) {
                const objectUrl = URL.createObjectURL(file);
                objectUrls.push(objectUrl);

                const card = document.createElement('div');
                card.className = 'preview-card';
                card.style.animationDelay = `${index * 0.1}s`;

                card.innerHTML = `
                    <div style="position: relative; overflow: hidden; border-radius: 14px;">
                        <img src="${objectUrl}" alt="${file.name}" loading="lazy">
                        <button type="button" class="btn-remove" data-index="${index}" aria-label="Remove image">
                            &times;
                        </button>
                    </div>
                    <div style="padding-top: 0.75rem;">
                        <strong style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9rem;">${file.name}</strong>
                        <small style="color: #64748b;">${(file.size / (1024 * 1024)).toFixed(2)} MB</small>
                    </div>
                `;

                previewContainer.appendChild(card);
            }
        });

        // Add remove functionality styles dynamically
        if (!document.getElementById('dynamic-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'dynamic-ui-styles';
            style.innerHTML = `
                .btn-remove {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 28px;
                    height: 28px;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 50%;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.2s var(--spring);
                    z-index: 2;
                }
                .btn-remove:hover {
                    background: #ef4444;
                    transform: scale(1.1);
                    border-color: #ef4444;
                }
            `;
            document.head.appendChild(style);
        }

        // Bind cancel buttons
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                removeFile(index);
            });
        });
    };

    const removeFile = (index) => {
        if (objectUrls[index]) URL.revokeObjectURL(objectUrls[index]);
        selectedFiles.splice(index, 1);
        objectUrls.splice(index, 1);

        const dt = new DataTransfer();
        selectedFiles.forEach(file => dt.items.add(file));
        fileInput.files = dt.files;

        if (selectedFiles.length === 0) {
            previewContainer.classList.add('hidden');
            previewContainer.innerHTML = '';
            resultsArea.innerHTML = ''; // Clear results if no files left
        } else {
            handleFiles(selectedFiles);
        }
    };

    fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

    // Drag & Drop Experience
    ["dragenter", "dragover"].forEach(evt => {
        uploadBox.addEventListener(evt, e => {
            e.preventDefault();
            e.stopPropagation();
            uploadBox.style.borderColor = "var(--accent-blue)";
            uploadBox.style.background = "rgba(0, 242, 254, 0.05)";
        });
    });

    ["dragleave", "drop"].forEach(evt => {
        uploadBox.addEventListener(evt, e => {
            e.preventDefault();
            e.stopPropagation();
            uploadBox.style.borderColor = "";
            uploadBox.style.background = "";
            if (evt === "drop" && e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFiles(e.dataTransfer.files);
            }
        });
    });

    // Modern Result Rendering with Staggered Animations
    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (selectedFiles.length === 0) {
            renderError("Please select at least one image file.");
            return;
        }

        const formData = new FormData();
        formData.append("image", selectedFiles[0]);
        formData.append("ajax", "true");

        analyzeBtn.classList.add('loading');
        analyzeBtn.disabled = true;
        resultsArea.style.opacity = '0.5';

        try {
            const response = await fetch("/", {
                method: "POST",
                body: formData,
                headers: { "X-Requested-With": "XMLHttpRequest" }
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonErr) {
                renderError("Server Error: Unable to parse response.");
                return;
            }

            if (!response.ok) {
                renderError(data.error || `Error ${response.status}`);
            } else {
                renderResults(data);
            }
        } catch (err) {
            renderError("Network error: Connection failure");
        } finally {
            analyzeBtn.classList.remove('loading');
            analyzeBtn.disabled = false;
            resultsArea.style.opacity = '1';
        }
    });

    function renderError(msg) {
        resultsArea.innerHTML = `
            <div class="card" style="border-color: #ef4444; animation: slideUp 0.4s var(--spring);">
                <div style="display: flex; align-items: center; gap: 1rem; color: #fca5a5;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>${msg}</span>
                </div>
            </div>
        `;
    }

    function renderResults(data) {
        let metadataHtml = '';
        let gpsHtml = '';

        const gpsData = extractGPSData(data.metadata);
        if (gpsData) {
            gpsHtml = `
                <a href="https://www.google.com/maps?q=${gpsData.lat},${gpsData.lon}" target="_blank" rel="noopener noreferrer" class="gps-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    View on Google Maps (${gpsData.lat.toFixed(4)}, ${gpsData.lon.toFixed(4)})
                </a>
            `;
        }

        if (data.metadata) {
            let sectionIndex = 0;
            for (const [section, tags] of Object.entries(data.metadata)) {
                if (tags && typeof tags === 'object' && !Array.isArray(tags)) {
                    let items = '';
                    for (const [k, v] of Object.entries(tags)) {
                        items += `<div class="metadata-item"><dt>${k}</dt><dd>${v}</dd></div>`;
                    }
                    metadataHtml += `
                        <details class="metadata-section" style="animation: slideUp 0.5s var(--spring) forwards; animation-delay: ${sectionIndex * 0.15}s; opacity: 0;">
                            <summary>${section}</summary>
                            <div class="metadata-list">${items}</div>
                        </details>
                    `;
                    sectionIndex++;
                }
            }
        }

        resultsArea.innerHTML = `
            <section class="card" style="animation: slideUp 0.5s var(--spring);">
                <h2><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> SHA-256 Signature</h2>
                <div class="code-block">${data.hash}</div>
            </section>

            <section class="card" style="animation: slideUp 0.5s var(--spring) forwards; animation-delay: 0.2s; opacity: 0;">
                <h2><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> Metadata Overview</h2>
                ${gpsHtml}
                ${metadataHtml || '<p style="color:#64748b">No high-level tags found.</p>'}
            </section>

            <section class="card" style="text-align: center; animation: slideUp 0.5s var(--spring) forwards; animation-delay: 0.4s; opacity: 0;">
                <h2 style="justify-content: center;">Sanitize Image</h2>
                <p style="color: #94a3b8; margin-bottom: 2rem;">Remove all hidden metadata from "${data.filename}"</p>
                <button id="downloadShreddedBtn" class="btn btn-primary" style="background: #ef4444; color: #fff; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.2); width: 100%;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download Shredded Image
                </button>
            </section>
        `;

        // Bind the direct download action
        document.getElementById("downloadShreddedBtn").addEventListener("click", () => {
            downloadShredded(selectedFiles[0]);
        });

        resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function extractGPSData(metadata) {
        if (!metadata || !metadata.GPS) return null;
        const gps = metadata.GPS;
        if (gps.GPSLatitude && gps.GPSLongitude) {
            return {
                lat: parseGPS(gps.GPSLatitude, gps.GPSLatitudeRef),
                lon: parseGPS(gps.GPSLongitude, gps.GPSLongitudeRef)
            };
        }
        return null;
    }

    function parseGPS(coord, ref) {
        if (!coord) return null;
        let dec = 0;
        if (Array.isArray(coord)) {
            dec = coord[0] + (coord[1] / 60) + (coord[2] / 3600);
        } else {
            dec = parseFloat(coord);
        }
        return (ref === 'S' || ref === 'W') ? -dec : dec;
    }

    /**
     * Download the shredded (cleaned) version of the file
     */
    async function downloadShredded(file) {
        const btn = document.getElementById("downloadShreddedBtn");
        const originalHtml = btn.innerHTML;

        btn.innerHTML = '<span class="loading-spinner"></span> Shredding...';
        btn.disabled = true;

        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch("/strip", {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Failed to shred image");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");

            // Clean filename
            const nameParts = file.name.split('.');
            const ext = nameParts.pop();
            const baseName = nameParts.join('.');

            a.href = url;
            a.download = `${baseName}_shredded.${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            console.error(err);
            alert("Error: Could not shred image. Please try again.");
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }
});
