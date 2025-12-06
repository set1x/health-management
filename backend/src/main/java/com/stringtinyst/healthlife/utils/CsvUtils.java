package com.stringtinyst.healthlife.utils;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.function.Function;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

public class CsvUtils {

  public static <T> void exportCsv(
      HttpServletResponse response,
      String filename,
      String[] headers,
      List<T> dataList,
      Function<T, List<Object>> mapper)
      throws IOException {
    response.setContentType("text/csv; charset=UTF-8");
    response.setCharacterEncoding("UTF-8");
    response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

    response.getOutputStream().write(new byte[] {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});

    try (CSVPrinter printer =
        new CSVPrinter(
            new OutputStreamWriter(response.getOutputStream(), StandardCharsets.UTF_8),
            CSVFormat.DEFAULT.builder().setHeader(headers).build())) {
      for (T item : dataList) {
        printer.printRecord(mapper.apply(item));
      }
    }
  }
}
