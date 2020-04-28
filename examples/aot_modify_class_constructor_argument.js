import { MonoApiHelper, MonoApi } from 'frida-mono-api'
import ClassHelper from 'libraries/class_helper'

/* 
    // For AOT-compiled applications only.
    // This example script can intercept the following method (constructor).
    // Furthermore it modifies the third argument (string c).

    namespace CompanyName.ProjectName.Views.Web.Html {

        class HtmlWebView {

            HtmlWebView(string a, string b, string c) {
                // This constructor will be intercepted.
            }

        }

    }
*/

// Intercept settings
var settingClassName = "CompanyName.ProjectName.Views.Web.Html.HtmlWebView";
var settingMethodName = ".ctor";
var settingMethodArgCount = 3;

// The root AppDomain is the initial domain created by the runtime when it is initialized. Programs execute on this AppDomain.
const domain = MonoApi.mono_get_root_domain()

// Get a reference to a certain class within the Xamarin application.
var classInformation = ClassHelper.getClassByName(settingClassName);

// Get the pointer to the ahead-of-time (AOT) compiled method
let methodInformation = MonoApiHelper.ClassGetMethodFromName(classInformation, settingMethodName, settingMethodArgCount)

// Allocate enough memory for MonoError initialization
let monoErrorMemory = Memory.alloc(32) 

// Get the pointer to the method
let nativeMethodPointer = MonoApi.mono_aot_get_method(domain, methodInformation, monoErrorMemory)

// Attach interceptor and fish out the first method argument
Interceptor.attach(nativeMethodPointer, {
    onEnter: function(args) {
        console.log("Entered " + settingMethodName + " with " + settingMethodArgCount + " argument(s).");
        console.log("Value of `string c`: " + MonoApiHelper.StringToUtf8(args[3]));

        args[3] = MonoApiHelper.StringNew('This is the replaced value of `string c`.', domain);
    },
    onLeave: function onLeave(log, retval, state) {
        console.log("Left " + settingMethodName + ".");
    }
})

// Log that the module was loaded succesfully
console.log(`[*] Loaded ${require('path').basename(__filename)}.`)
