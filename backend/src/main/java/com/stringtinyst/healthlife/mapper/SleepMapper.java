package com.stringtinyst.healthlife.mapper;

import com.stringtinyst.healthlife.pojo.Sleep;
import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface SleepMapper {

  List<Sleep> list(String userID, LocalDate startDate, LocalDate endDate);

  @Insert(
      "INSERT INTO sleepitem(UserID, RecordDate, BedTime, WakeTime) VALUES (#{userID}, #{recordDate}, #{bedTime}, #{wakeTime})")
  void insertSleep(Sleep sleep);

  @Select({
    "<script>",
    "SELECT SleepItemID FROM sleepitem",
    "WHERE UserID = #{userID}",
    "AND RecordDate = #{recordDate}",
    "<if test='bedTime != null'>AND BedTime = #{bedTime}</if>",
    "<if test='bedTime == null'>AND BedTime IS NULL</if>",
    "<if test='wakeTime != null'>AND WakeTime = #{wakeTime}</if>",
    "<if test='wakeTime == null'>AND WakeTime IS NULL</if>",
    "ORDER BY SleepItemID DESC LIMIT 1",
    "</script>"
  })
  int searchSleepItemID(Sleep sleep);

  @Select("SELECT * FROM sleepitem WHERE SleepItemID = #{sleepItemID}")
  Sleep getBySleepItemID(int sleepItemID);

  @Update(
      "UPDATE sleepitem SET RecordDate = #{recordDate}, BedTime = #{bedTime}, WakeTime = #{wakeTime} WHERE SleepItemID = #{sleepItemID}")
  void updateSleep(Sleep sleep);

  @Delete("DELETE FROM sleepitem WHERE SleepItemID = #{sleepItemID}")
  void deleteSleep(int sleepItemID);
}
