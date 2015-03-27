;;; cl-format-autoloads.el --- automatically extracted autoloads
;;
;;; Code:


;;;### (autoloads (cl-format-font-lock-mode cl-message cl-error cl-formatter
;;;;;;  cl-format) "cl-format" "../../../../../.emacs.d/elpa/cl-format-1.1/cl-format.el"
;;;;;;  "e0be008e5b9120555047f18aeaf7ce03")
;;; Generated autoloads from ../../../../../.emacs.d/elpa/cl-format-1.1/cl-format.el

(autoload 'cl-format "cl-format" "\
Format FMT using ARGS and print it to STREAM.

The full documentation not available until this function is
loaded.

\(fn STREAM FMT &rest ARGS)" nil nil)

(autoload 'cl-formatter "cl-format" "\
Compile FMT into a function.

This macro parses and compiles FMT into a function, which may be
passed as format argument to `cl-format'.

\(fn FMT)" nil t)

(autoload 'cl-error "cl-format" "\
Like `error', but use CL format strings.

\(fn FMT &rest ARGS)" nil nil)

(autoload 'cl-message "cl-format" "\
Like `error', but use CL format strings.

\(fn FMT &rest ARGS)" nil nil)

(autoload 'cl-format-font-lock-mode "cl-format" "\
Adds font-lock support for cl format strings.

\(fn &optional ARG)" t nil)

;;;***

;;;### (autoloads nil nil ("../../../../../.emacs.d/elpa/cl-format-1.1/cl-format-builtins.el"
;;;;;;  "../../../../../.emacs.d/elpa/cl-format-1.1/cl-format-def.el"
;;;;;;  "../../../../../.emacs.d/elpa/cl-format-1.1/cl-format-pkg.el"
;;;;;;  "../../../../../.emacs.d/elpa/cl-format-1.1/cl-format.el"
;;;;;;  "../../../../../.emacs.d/elpa/cl-format-1.1/clisp-format.el")
;;;;;;  (21780 54474 245508 665000))

;;;***

(provide 'cl-format-autoloads)
;; Local Variables:
;; version-control: never
;; no-byte-compile: t
;; no-update-autoloads: t
;; coding: utf-8
;; End:
;;; cl-format-autoloads.el ends here
