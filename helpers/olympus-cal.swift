import EventKit
import Foundation
import Cocoa

// olympus-cal: Query Apple Calendar events via EventKit, output JSON
// Usage: olympus-cal [days] (default: 7)
//        olympus-cal today
//        olympus-cal YYYY-MM-DD YYYY-MM-DD

let store = EKEventStore()
let semaphore = DispatchSemaphore(value: 0)
let cal = Calendar.current
let args = CommandLine.arguments

let isoFormatter = ISO8601DateFormatter()
isoFormatter.formatOptions = [.withInternetDateTime]

let df = DateFormatter()
df.dateFormat = "yyyy-MM-dd"

func parseDate(_ s: String) -> Date? {
    return df.date(from: s)
}

store.requestFullAccessToEvents { granted, error in
    guard granted else {
        let errMsg = error?.localizedDescription ?? "unknown"
        print("{\"error\": \"ACCESS_DENIED: \(errMsg)\"}")
        semaphore.signal()
        return
    }

    var startDate: Date
    var endDate: Date

    if args.count >= 3, let s = parseDate(args[1]), let e = parseDate(args[2]) {
        // Range mode: olympus-cal YYYY-MM-DD YYYY-MM-DD
        startDate = cal.startOfDay(for: s)
        endDate = cal.date(byAdding: .day, value: 1, to: cal.startOfDay(for: e))!
    } else if args.count >= 2 && args[1] == "today" {
        startDate = cal.startOfDay(for: Date())
        endDate = cal.date(byAdding: .day, value: 1, to: startDate)!
    } else if args.count >= 2, let days = Int(args[1]) {
        startDate = cal.startOfDay(for: Date())
        endDate = cal.date(byAdding: .day, value: days, to: startDate)!
    } else {
        // Default: next 7 days
        startDate = cal.startOfDay(for: Date())
        endDate = cal.date(byAdding: .day, value: 7, to: startDate)!
    }

    let predicate = store.predicateForEvents(withStart: startDate, end: endDate, calendars: nil)
    let events = store.events(matching: predicate).sorted { $0.startDate < $1.startDate }

    var jsonEvents: [[String: Any]] = []

    for event in events {
        let status: String
        switch event.status {
        case .confirmed: status = "confirmed"
        case .tentative: status = "tentative"
        case .canceled: status = "canceled"
        default: status = "none"
        }

        var dict: [String: Any] = [
            "title": event.title ?? "(no title)",
            "calendar": event.calendar.title,
            "calendarColor": String(format: "#%06x", event.calendar.cgColor.flatMap { 
                let c = NSColor(cgColor: $0)
                if let rgb = c?.usingColorSpace(.sRGB) {
                    return Int(rgb.redComponent * 255) << 16 | Int(rgb.greenComponent * 255) << 8 | Int(rgb.blueComponent * 255)
                }
                return nil
            } ?? 0x888888),
            "startDate": isoFormatter.string(from: event.startDate),
            "endDate": isoFormatter.string(from: event.endDate),
            "isAllDay": event.isAllDay,
            "status": status,
            "location": event.location ?? ""
        ]

        if let notes = event.notes, !notes.isEmpty {
            dict["notes"] = String(notes.prefix(200))
        }

        jsonEvents.append(dict)
    }

    let result: [String: Any] = [
        "queryStart": isoFormatter.string(from: startDate),
        "queryEnd": isoFormatter.string(from: endDate),
        "count": jsonEvents.count,
        "events": jsonEvents
    ]

    if let jsonData = try? JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys]),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        print(jsonString)
    } else {
        print("{\"error\": \"JSON serialization failed\"}")
    }

    semaphore.signal()
}

semaphore.wait()
