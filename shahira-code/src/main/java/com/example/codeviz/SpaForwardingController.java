package com.example.codeviz;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaForwardingController {

    @RequestMapping({
        "/",
        "/login",
        "/signup",
        "/profile",
        "/problems",
        "/playground",
        "/pricing",
        "/contact"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
