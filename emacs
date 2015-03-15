;; -*- mode: Emacs-lisp; lexical-binding: t -*-
;;============================================
;; Emacs config
;;============================================

(setq vc-follow-symlinks t)
(add-to-list 'load-path "~/.emacs.d/")

;;=====================================
;; Utilities
;;=====================================

(defun cc/empty-or-nil-p (x)
  (or (null x) (string= "" x)))
(defun cc/any (ls)
  (reduce '(lambda (x y) (or x y)) ls))
(defun cc/all (ls)
  (reduce '(lambda (x y) (and x y)) ls))
(defun cc/first-non-nil (ls)
  (cond
   ((null ls) nil)
   ((null (car ls)) (cc/first-non-nil (cdr ls)))
   (t (car ls))))

(defun cc/find-file-or-nil (path &optional prefix)
  (let ((dirs (list ""
                    prefix
                    (getenv "HOME")
                    (concat (getenv "HOME") "/.emacs.d/lisp")
                    (concat (getenv "HOME") "/ext")
                    (concat (getenv "HOME") "/ext/share/emacs/site-lisp"))))
    (cc/first-non-nil
     (mapcar (lambda (x)
               (let ((full-path (command-line-normalize-file-name (concat x "/" path))))
                 (when (file-exists-p full-path) full-path)))
             dirs))))

(defun cc/add-to-load-path-if-exists (path &optional prefix)
  "Add a path to load-path if it exists."
  (let ((full-path (cc/find-file-or-nil path prefix)))
    (when (and full-path (file-exists-p full-path))
      (add-to-list 'load-path full-path))))

;;====================================
;; Package-initialize
;;=====================================

(package-initialize)
(add-to-list 'package-archives
             '("marmalade" . "https://marmalade-repo.org/packages/"))

;;====================================
;; Text highlighting
;;=====================================

;; Turn on red highlighting for characters outside of the 80/100 char limit
(add-hook 'c++-mode-hook
         '(lambda () (font-lock-set-up-width-warning 80)))
(add-hook 'java-mode-hook
         '(lambda () (font-lock-set-up-width-warning 100)))
(add-hook 'js-mode-hook
         '(lambda () (font-lock-set-up-width-warning 80)))
(add-hook 'python-mode-hook
         '(lambda () (font-lock-set-up-width-warning 80)))
(add-hook 'sh-mode-hook
         '(lambda () (font-lock-set-up-width-warning 80)))

(defun font-lock-width-keyword (width)
  "Return a font-lock style keyword for a string beyond width WIDTH
that uses 'font-lock-warning-face'."
  `((,(format "^%s\\(.+\\)" (make-string width ?.))
     (1 font-lock-warning-face t))))

(font-lock-add-keywords 'c++-mode (font-lock-width-keyword 80))
(font-lock-add-keywords 'java-mode (font-lock-width-keyword 100))
(font-lock-add-keywords 'js-mode (font-lock-width-keyword 80))
(font-lock-add-keywords 'python-mode (font-lock-width-keyword 80))

(custom-set-faces
  ;; custom-set-faces was added by Custom.
  ;; If you edit it by hand, you could mess it up, so be careful.
  ;; Your init file should contain only one such instance.
  ;; If there is more than one, they won't work right.
 '(default ((t (:inherit nil :stipple nil :background "black" :foreground "white" :inverse-video nil :box nil :strike-through nil :overline nil :underline nil :slant normal :weight normal :height 70 :width normal :foundry "unknown" :family "DejaVu Sans Mono"))))
 '(cursor ((t (:background "red"))))
 '(my-long-line-face ((((class color)) (:background "blue" :underline t))) t)
 '(my-tab-face ((((class color)) (:background "white"))) t)
 '(my-trailing-space-face ((((class color)) (:background "red"))) t))
(add-hook 'font-lock-mode-hook
            (function
             (lambda ()
               (setq font-lock-keywords
                     (append font-lock-keywords
                          '(("\t+" (0 'my-tab-face t))
                            ("^.\\{81,\\}$" (0 'my-long-line-face t))
                           ("[ \t]+$"      (0 'my-trailing-space-face t))))))))

;;=====================================
;; Whitespace - From ~adonovan/.emacs
;;=====================================

(add-hook 'write-file-hooks 'maybe-delete-trailing-whitespace)

(defvar skip-whitespace-check nil
  "If non-nil, inhibits behaviour of
  `maybe-delete-trailing-whitespace', which is typically a
  write-file-hook.  This variable may be buffer-local, to permit
  extraneous whitespace on a per-file basis.")
(make-variable-buffer-local 'skip-whitespace-check)


(defun buffer-whitespace-normalized-p ()
  "Returns non-nil if the current buffer contains no tab characters
nor trailing whitespace.  This predicate is useful for determining
whether to enable automatic whitespace normalization.  Simply applying
it blindly to other people's files can cause enormously messy diffs!"
  (save-excursion
    (not  (or (progn (beginning-of-buffer)
                     (search-forward "\t" nil t))
              (progn (beginning-of-buffer)
                     (re-search-forward " +$" nil t))))))


(defun whitespace-check-find-file-hook ()
  (unless (buffer-whitespace-normalized-p)
    (message "Disabling whitespace normalization for this buffer...")
    (setq skip-whitespace-check t)))


;; Install hook so we don't accidentally normalise non-normal files.
(setq find-file-hooks
      (cons #'whitespace-check-find-file-hook find-file-hooks))


(defun toggle-whitespace-removal ()
  "Toggle the value of `skip-whitespace-check' in this buffer."
  (interactive)
  (setq skip-whitespace-check (not skip-whitespace-check))
  (message "Whitespace trimming %s"
           (if skip-whitespace-check "disabled" "enabled")))


(defun maybe-delete-trailing-whitespace ()
  "Calls `delete-trailing-whitespace' iff buffer-local variable
 skip-whitespace-check is nil.  Returns nil."
  (or skip-whitespace-check
      (delete-trailing-whitespace))
  nil)

(defun delete-trailing-blank-lines ()
      "Deletes all blank lines at the end of the file."
      (interactive)
      (save-excursion
        (save-restriction
          (widen)
          (goto-char (point-max))
          (delete-blank-lines))))

(add-hook 'write-file-hooks 'delete-trailing-blank-lines)

;;=====================================
;; 'Murica
;;=====================================

(set-variable 'debian-ispell-dictionary "american")


;;=====================================
;; EMACS <3s teh chrome!
;;=====================================

(setq browse-url-browser-function 'browse-url-generic
      browse-url-generic-program "google-chrome")


;;------------------------------------------------------
;; Dart
;;------------------------------------------------------

(require 'dart-mode)
(add-to-list 'auto-mode-alist '("\\.dart\\'" . dart-mode))

;;------------------------------------------------------
;; Window Management
;;------------------------------------------------------

;; Move around using alt keys!
(windmove-default-keybindings 'meta)

;; Set transparency of emacs
(defun transparency (value)
  "Sets the transparency of the frame window. 0=transparent/100=opaque"
  (interactive "nTransparency Value 0 - 100 opaque:")
  (set-frame-parameter (selected-frame) 'alpha value))

;;------------------------------------------------------
;; Temporary file creation
;;------------------------------------------------------

;; Make sure the backup directory is in ~/.saves, not local directory.
(setq backup-directory-alist `(("." . "~/.saves")))
(setq backup-by-copying t)

;;------------------------------------------------------
;; Unknown (copied from Craig's?)
;;------------------------------------------------------

(setq find-file-visit-truename t)
(custom-set-variables
  ;; custom-set-variables was added by Custom.
  ;; If you edit it by hand, you could mess it up, so be careful.
  ;; Your init file should contain only one such instance.
  ;; If there is more than one, they won't work right.
 '(gud-chdir-before-run nil)
 '(inhibit-startup-screen t))

;;------------------------------------------------------
;; Other configuration (e.g. google)
;;------------------------------------------------------

;; Disable ctrl-z, since I still tend to hit that every so often
(global-set-key "\C-z" nil)

(let ((gconfig (cc/find-file-or-nil ".emacs.google")))
  (when gconfig
    (load-file gconfig)))
